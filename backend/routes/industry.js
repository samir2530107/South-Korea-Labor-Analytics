
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { toInt, num, route } = require('../utils/helpers');

// GET /api/industry/meta
router.get('/meta', route('industry meta', async (req, res) => {

  const [yearRows] = await db.query(`
    SELECT DISTINCT y.year_value
    FROM industry_labor_stats s
    JOIN \`year\` y ON s.year_id = y.year_id
    WHERE s.total_wages IS NOT NULL
       OR s.total_hours_worked IS NOT NULL
    ORDER BY y.year_value DESC
  `);

  const [sizeRows] = await db.query(`
    SELECT size_id, size_category
    FROM establishment_size
    ORDER BY size_id
  `);

  res.json({
    success: true,
    years: yearRows.map(row => row.year_value),
    sizes: sizeRows
  });
}));

// GET /api/industry?year=2025&sizeId=1
router.get('/', route('industry', async (req, res) => {

  const [yearRows] = await db.query(`
    SELECT DISTINCT y.year_value
    FROM industry_labor_stats s
    JOIN \`year\` y ON s.year_id = y.year_id
    WHERE s.total_wages IS NOT NULL
       OR s.total_hours_worked IS NOT NULL
    ORDER BY y.year_value DESC
  `);

  const years = yearRows.map(row => row.year_value);
  const requested = toInt(req.query.year);
  const year = requested && years.includes(requested)
    ? requested
    : years[0] ?? null;

  if (year === null) {
    return res.json({
      success: true,
      year: null,
      data: []
    });
  }

  const params = [year];
  let sizeFilter = '';

  const sizeId = toInt(req.query.sizeId);

  if (sizeId !== null) {
    sizeFilter = 'AND s.size_id = ?';
    params.push(sizeId);
  }

  const [rows] = await db.query(`
    SELECT
      i.industry_name,
      es.size_id,
      es.size_category,
      y.year_value,
      s.total_wages,
      s.total_hours_worked,
      s.regular_hours_worked,
      s.overtime_hours_worked,
      s.total_days_worked
    FROM industry_labor_stats s
    JOIN industry i ON s.industry_id = i.industry_id
    JOIN establishment_size es ON s.size_id = es.size_id
    JOIN \`year\` y ON s.year_id = y.year_id
    WHERE y.year_value = ? ${sizeFilter}
    ORDER BY i.industry_id, es.size_id
  `, params);

  res.json({
    success: true,
    year,
    data: rows.map(row => ({
      industry_name: row.industry_name,
      size_id: row.size_id,
      size_category: row.size_category,
      year_value: row.year_value,
      total_wages: num(row.total_wages),
      total_hours_worked: num(row.total_hours_worked),
      regular_hours_worked: num(row.regular_hours_worked),
      overtime_hours_worked: num(row.overtime_hours_worked),
      total_days_worked: num(row.total_days_worked)
    }))
  });
}));

// GET /api/industry/trend?sizeId=1
router.get('/trend', route('industry trend', async (req, res) => {

  const params = [];
  let sizeFilter = '';

  const sizeId = toInt(req.query.sizeId);

  if (sizeId !== null) {
    sizeFilter = 'WHERE s.size_id = ?';
    params.push(sizeId);
  }

  const [rows] = await db.query(`
    SELECT
      i.industry_name,
      y.year_value,
      s.total_wages,
      s.total_hours_worked
    FROM industry_labor_stats s
    JOIN industry i ON s.industry_id = i.industry_id
    JOIN \`year\` y ON s.year_id = y.year_id
    ${sizeFilter}
    ORDER BY i.industry_id, y.year_value
  `, params);

  res.json({
    success: true,
    data: rows.map(row => ({
      industry_name: row.industry_name,
      year_value: row.year_value,
      total_wages: num(row.total_wages),
      total_hours_worked: num(row.total_hours_worked)
    }))
  });
}));

module.exports = router;
