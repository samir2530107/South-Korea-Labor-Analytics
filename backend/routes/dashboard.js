
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { num, route } = require('../utils/helpers');

// GET /api/dashboard
router.get('/', route('dashboard', async (req, res) => {

  const [[industryCount]] = await db.query(
    'SELECT COUNT(*) AS total FROM industry_labor_stats'
  );

  const [[regionalCount]] = await db.query(
    'SELECT COUNT(*) AS total FROM regional_labor_stats'
  );

  const industryRecords = Number(industryCount.total);
  const regionalRecords = Number(regionalCount.total);

  // Latest year with regional data
  const [[latest]] = await db.query(`
    SELECT MAX(y.year_value) AS latest
    FROM regional_labor_stats s
    JOIN \`year\` y ON s.year_id = y.year_id
  `);

  const latestYear = latest.latest ?? null;

  // Latest employment data for all seven cities
  let regions = [];

  if (latestYear !== null) {
    const [rows] = await db.query(`
      SELECT
        r.region_name,
        s.employment_to_population_ratio,
        s.unemployment_rate
      FROM regional_labor_stats s
      JOIN region r ON s.region_id = r.region_id
      JOIN gender g ON s.gender_id = g.gender_id
      JOIN \`year\` y ON s.year_id = y.year_id
      WHERE g.gender_name = 'Total'
        AND y.year_value = ?
      ORDER BY r.region_id
    `, [latestYear]);

    regions = rows.map(row => ({
      region_name: row.region_name,
      employment_to_population_ratio: num(row.employment_to_population_ratio),
      unemployment_rate: num(row.unemployment_rate)
    }));
  }

  // Historical employment and unemployment trends
  const [trend] = await db.query(`
    SELECT
      y.year_value,
      AVG(s.employment_to_population_ratio) AS avg_employment,
      AVG(s.unemployment_rate) AS avg_unemployment
    FROM regional_labor_stats s
    JOIN gender g ON s.gender_id = g.gender_id
    JOIN \`year\` y ON s.year_id = y.year_id
    WHERE g.gender_name = 'Total'
    GROUP BY y.year_value
    ORDER BY y.year_value
  `);

  res.json({
    success: true,
    database: 'south_korea_labor_market',
    industryRecords,
    regionalRecords,
    totalRecords: industryRecords + regionalRecords,
    latestYear,
    regions,
    trend: trend.map(row => ({
      year_value: row.year_value,
      avg_employment: num(row.avg_employment),
      avg_unemployment: num(row.avg_unemployment)
    }))
  });

}));

module.exports = router;
