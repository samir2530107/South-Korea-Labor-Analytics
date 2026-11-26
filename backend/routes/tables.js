
// READ-ONLY table viewer. Only GET routes exist here.
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { escapeId } = require('mysql2');
const { toInt, route } = require('../utils/helpers');

// Only these tables can ever be read.
const TABLES = {
  region: {
    label: 'Region',
    readable: false
  },
  gender: {
    label: 'Gender',
    readable: false
  },
  year: {
    label: 'Year',
    readable: false
  },
  industry: {
    label: 'Industry',
    readable: false
  },
  establishment_size: {
    label: 'Establishment Size',
    readable: false
  },
  regional_labor_stats: {
    label: 'Regional Labor Stats',
    readable: true
  },
  industry_labor_stats: {
    label: 'Industry Labor Stats',
    readable: true
  }
};

// Joins for readable views.
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

// GET /api/tables
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

  res.json({
    success: true,
    tables
  });
}));

// GET /api/tables/:name?page=1&limit=25&search=seoul&view=readable
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

  const [colRows] = await db.query(
    `SHOW COLUMNS FROM ${escapeId(name)}`
  );

  const rawColumns = colRows.map(column => column.Field);
  const firstColumn = rawColumns[0];

  let selectList;
  let fromSql;
  let searchExprs;

  if (wantReadable) {
    const cfg = READABLE[name];

    const own = rawColumns
      .filter(column => !cfg.hide.includes(column))
      .map(column => ({
        expr: `s.${escapeId(column)}`,
        alias: column
      }));

    const all = [
      ...own.slice(0, 1),
      ...cfg.lookups,
      ...own.slice(1)
    ];

    selectList = all
      .map(column => `${column.expr} AS ${escapeId(column.alias)}`)
      .join(', ');

    searchExprs = all.map(column => column.expr);
    fromSql = `${escapeId(name)} AS s ${cfg.joins}`;
  } else {
    selectList = rawColumns
      .map(column => `t.${escapeId(column)}`)
      .join(', ');

    searchExprs = rawColumns.map(
      column => `t.${escapeId(column)}`
    );

    fromSql = `${escapeId(name)} AS t`;
  }

  let orderBy;
  if (wantReadable && name === 'regional_labor_stats') {
    // Group by region and year, then Male → Female → Total within each group
    orderBy = `r.region_id ASC, y.year_value ASC, FIELD(g.gender_name, 'Male', 'Female', 'Total') ASC`;
  } else {
    const orderPrefix = wantReadable ? 's' : 't';
    orderBy = `${orderPrefix}.${escapeId(firstColumn)} ASC`;
  }

  let where = '';
  const params = [];

  if (search) {
    where = `WHERE CONCAT_WS(' ', ${searchExprs.join(', ')}) LIKE ?`;
    params.push(`%${search}%`);
  }

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
    columns: rows.length > 0
      ? Object.keys(rows[0])
      : (wantReadable
          ? [
              ...rawColumns.filter(column => !READABLE[name].hide.includes(column)).slice(0, 1),
              ...READABLE[name].lookups.map(column => column.alias),
              ...rawColumns.filter(column => !READABLE[name].hide.includes(column)).slice(1)
            ]
          : rawColumns),
    rows,
    total,
    page: safePage,
    limit,
    totalPages
  });
}));

module.exports = router;
