// Read-only table viewer. Only GET routes exist here.
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { escapeId } = require('mysql2');
const { toInt, route } = require('../utils/helpers');
const {
  REGIONAL_FIELDS,
  normalizeGender,
  normalizeRegionalRows,
  summarizeQuality
} = require('../utils/regionalQuality');

const TABLES = {
  region: { label: 'Region', readable: false },
  gender: { label: 'Gender', readable: false },
  year: { label: 'Year', readable: false },
  industry: { label: 'Industry', readable: false },
  establishment_size: { label: 'Establishment Size', readable: false },
  regional_labor_stats: { label: 'Regional Labor Stats', readable: true },
  industry_labor_stats: { label: 'Industry Labor Stats', readable: true }
};

const READABLE = {
  regional_labor_stats: {
    joins: `
      LEFT JOIN region AS r ON s.region_id = r.region_id
      LEFT JOIN gender AS g ON s.gender_id = g.gender_id
      LEFT JOIN \`year\` AS y ON s.year_id = y.year_id
    `,
    lookups: [
      { expr: 'r.region_name', alias: 'region_name' },
      { expr: 'g.gender_name', alias: 'gender_name' },
      { expr: 'y.year_value', alias: 'year_value' }
    ],
    hide: ['region_id', 'gender_id', 'year_id']
  },
  industry_labor_stats: {
    joins: `
      LEFT JOIN industry AS i ON s.industry_id = i.industry_id
      LEFT JOIN establishment_size AS es ON s.size_id = es.size_id
      LEFT JOIN \`year\` AS y ON s.year_id = y.year_id
    `,
    lookups: [
      { expr: 'i.industry_name', alias: 'industry_name' },
      { expr: 'es.size_category', alias: 'size_category' },
      { expr: 'y.year_value', alias: 'year_value' }
    ],
    hide: ['industry_id', 'size_id', 'year_id']
  }
};

function readableColumns(name, rawColumns) {
  const config = READABLE[name];
  const ownColumns = rawColumns
    .filter(column => !config.hide.includes(column))
    .map(column => ({ expr: `s.${escapeId(column)}`, alias: column }));

  return [
    ...ownColumns.slice(0, 1),
    ...config.lookups,
    ...ownColumns.slice(1)
  ];
}

function pageValues(rows, columns, page, limit) {
  const total = rows.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * limit;
  const pageRows = rows.slice(offset, offset + limit).map(row => {
    const result = {};
    for (const column of columns) result[column.alias] = row[column.alias];
    return result;
  });

  return { total, totalPages, safePage, offset, rows: pageRows };
}

async function getCorrectedRegionalTable({ rawColumns, search, page, limit }) {
  const [sourceRows] = await db.query(`
    SELECT
      s.*,
      r.region_id AS __region_order,
      r.region_name AS region_name,
      g.gender_name AS gender_name,
      y.year_value AS year_value
    FROM regional_labor_stats AS s
    LEFT JOIN region AS r ON s.region_id = r.region_id
    LEFT JOIN gender AS g ON s.gender_id = g.gender_id
    LEFT JOIN \`year\` AS y ON s.year_id = y.year_id
    ORDER BY r.region_id, y.year_value,
      FIELD(g.gender_name, 'Male', 'Female', 'Total')
  `);

  const { data: totals, issues } = normalizeRegionalRows(sourceRows.map(row => ({
    ...row,
    region_id: row.__region_order
  })));
  const totalByRegionYear = new Map(totals.map(row => [
    `${row.region_id}::${row.year_value}`,
    row
  ]));

  const correctedRows = sourceRows.map(row => {
    if (normalizeGender(row.gender_name) !== 'total') return row;
    const key = `${row.__region_order}::${row.year_value}`;
    const corrected = totalByRegionYear.get(key);
    if (!corrected) return row;

    return {
      ...row,
      ...Object.fromEntries(REGIONAL_FIELDS.map(field => [field, corrected[field]]))
    };
  });

  const columns = readableColumns('regional_labor_stats', rawColumns);
  const searchableColumns = columns.map(column => column.alias);
  const normalizedSearch = search.toLocaleLowerCase();
  const filteredRows = normalizedSearch
    ? correctedRows.filter(row => searchableColumns.some(column =>
        String(row[column] ?? '').toLocaleLowerCase().includes(normalizedSearch)
      ))
    : correctedRows;
  const result = pageValues(filteredRows, columns, page, limit);

  const visibleGroupKeys = new Set(filteredRows.map(row => `${row.__region_order}::${row.year_value}`));
  const visibleIssues = issues.filter(issue =>
    visibleGroupKeys.has(`${issue.region_id ?? ''}::${issue.year_value}`)
  );

  return {
    ...result,
    columns: columns.map(column => column.alias),
    dataQuality: summarizeQuality(visibleIssues, visibleGroupKeys.size)
  };
}

router.get('/', route('table list', async (req, res) => {
  const tables = [];

  for (const [name, info] of Object.entries(TABLES)) {
    const [[row]] = await db.query(
      `SELECT COUNT(*) AS total FROM ${escapeId(name)}`
    );

    tables.push({
      name,
      label: info.label,
      readable: info.readable,
      rows: Number(row.total)
    });
  }

  res.json({ success: true, tables });
}));

router.get('/:name', route('table', async (req, res) => {
  const name = String(req.params.name || '').toLowerCase();
  const info = TABLES[name];

  if (!info) {
    return res.status(404).json({
      success: false,
      message: `Table "${req.params.name}" is not available.`
    });
  }

  const limit = Math.min(Math.max(toInt(req.query.limit) || 25, 1), 200);
  const page = Math.max(toInt(req.query.page) || 1, 1);
  const search = String(req.query.search || '').trim().slice(0, 100);
  const wantReadable = req.query.view === 'readable' && info.readable;

  const [colRows] = await db.query(`SHOW COLUMNS FROM ${escapeId(name)}`);
  const rawColumns = colRows.map(column => column.Field);

  if (wantReadable && name === 'regional_labor_stats') {
    const result = await getCorrectedRegionalTable({ rawColumns, search, page, limit });
    return res.json({
      success: true,
      table: name,
      label: info.label,
      view: 'readable',
      ...result,
      page: Math.min(page, result.totalPages),
      limit
    });
  }

  const firstColumn = rawColumns[0];
  let selectList;
  let fromSql;
  let searchExprs;
  let outputColumns;

  if (wantReadable) {
    const columns = readableColumns(name, rawColumns);
    selectList = columns
      .map(column => `${column.expr} AS ${escapeId(column.alias)}`)
      .join(', ');
    searchExprs = columns.map(column => column.expr);
    fromSql = `${escapeId(name)} AS s ${READABLE[name].joins}`;
    outputColumns = columns.map(column => column.alias);
  } else {
    selectList = rawColumns
      .map(column => `t.${escapeId(column)}`)
      .join(', ');
    searchExprs = rawColumns.map(column => `t.${escapeId(column)}`);
    fromSql = `${escapeId(name)} AS t`;
    outputColumns = rawColumns;
  }

  let orderBy;
  if (wantReadable && name === 'regional_labor_stats') {
    orderBy = `r.region_id ASC, y.year_value ASC, FIELD(g.gender_name, 'Male', 'Female', 'Total') ASC`;
  } else {
    const orderPrefix = wantReadable ? 's' : 't';
    orderBy = `${orderPrefix}.${escapeId(firstColumn)} ASC`;
  }

  const where = search
    ? `WHERE CONCAT_WS(' ', ${searchExprs.join(', ')}) LIKE ?`
    : '';
  const params = search ? [`%${search}%`] : [];

  const [[countRow]] = await db.query(
    `SELECT COUNT(*) AS total FROM ${fromSql} ${where}`,
    params
  );
  const total = Number(countRow.total);
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * limit;
  const [rows] = await db.query(
    `SELECT ${selectList}
     FROM ${fromSql}
     ${where}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    table: name,
    label: info.label,
    view: wantReadable ? 'readable' : 'raw',
    columns: rows.length > 0 ? Object.keys(rows[0]) : outputColumns,
    rows,
    total,
    page: safePage,
    limit,
    totalPages
  });
}));

module.exports = router;
