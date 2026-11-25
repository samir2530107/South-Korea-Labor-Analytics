
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { toInt, num, route } = require('../utils/helpers');

// GET /api/unemployment?year=2024
router.get('/', route('unemployment', async (req, res) => {

  // Get years containing regional data
  const [yearRows] = await db.query(`
    SELECT DISTINCT y.year_value
    FROM regional_labor_stats s
    JOIN \`year\` y ON s.year_id = y.year_id
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
      years,
      data: []
    });
  }

  // Get unemployment data for all regions (Total gender)
  const [rows] = await db.query(`
    SELECT
      r.region_name,
      y.year_value,
      s.unemployment_rate,
      s.economically_active_population
    FROM regional_labor_stats s
    JOIN region r ON s.region_id = r.region_id
    JOIN gender g ON s.gender_id = g.gender_id
    JOIN \`year\` y ON s.year_id = y.year_id
    WHERE g.gender_name = 'Total'
      AND y.year_value = ?
    ORDER BY s.unemployment_rate DESC, r.region_id
  `, [year]);

  res.json({
    success: true,
    year,
    years,
    data: rows.map(row => ({
      region_name: row.region_name,
      year_value: row.year_value,
      unemployment_rate: num(row.unemployment_rate),
      economically_active_population: num(row.economically_active_population)
    }))
  });

}));

module.exports = router;
