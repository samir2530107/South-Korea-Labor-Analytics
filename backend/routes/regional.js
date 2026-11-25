
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { toInt, num, route } = require('../utils/helpers');

// Get years that contain regional data (newest first)
async function regionalYears() {
  const [rows] = await db.query(`
    SELECT DISTINCT y.year_value
    FROM regional_labor_stats s
    JOIN \`year\` y ON s.year_id = y.year_id
    ORDER BY y.year_value DESC
  `);

  return rows.map(row => row.year_value);
}

// GET /api/regional/years
router.get('/years', route('regional years', async (req, res) => {
  const years = await regionalYears();

  res.json({
    success: true,
    years,
    latestYear: years[0] ?? null
  });
}));

// GET /api/regional/employment?year=2024
router.get('/employment', route('regional employment', async (req, res) => {
  const years = await regionalYears();
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

  const [rows] = await db.query(`
    SELECT
      r.region_name,
      y.year_value,
      s.employment_to_population_ratio,
      s.labor_force_participation_rate,
      s.unemployment_rate
    FROM regional_labor_stats s
    JOIN region r ON s.region_id = r.region_id
    JOIN gender g ON s.gender_id = g.gender_id
    JOIN \`year\` y ON s.year_id = y.year_id
    WHERE g.gender_name = 'Total'
      AND y.year_value = ?
    ORDER BY s.employment_to_population_ratio DESC, r.region_id
  `, [year]);

  res.json({
    success: true,
    year,
    data: rows.map(row => ({
      region_name: row.region_name,
      year_value: row.year_value,
      employment_to_population_ratio: num(row.employment_to_population_ratio),
      labor_force_participation_rate: num(row.labor_force_participation_rate),
      unemployment_rate: num(row.unemployment_rate)
    }))
  });
}));

// GET /api/regional/trend
router.get('/trend', route('regional trend', async (req, res) => {
  const [rows] = await db.query(`
    SELECT
      r.region_id,
      r.region_name,
      y.year_value,
      s.employment_to_population_ratio,
      s.labor_force_participation_rate,
      s.unemployment_rate
    FROM regional_labor_stats s
    JOIN region r ON s.region_id = r.region_id
    JOIN gender g ON s.gender_id = g.gender_id
    JOIN \`year\` y ON s.year_id = y.year_id
    WHERE g.gender_name = 'Total'
    ORDER BY r.region_id, y.year_value
  `);

  res.json({
    success: true,
    data: rows.map(row => ({
      region_name: row.region_name,
      year_value: row.year_value,
      employment_to_population_ratio: num(row.employment_to_population_ratio),
      labor_force_participation_rate: num(row.labor_force_participation_rate),
      unemployment_rate: num(row.unemployment_rate)
    }))
  });
}));

module.exports = router;
