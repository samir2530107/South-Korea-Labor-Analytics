const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { num, route } = require('../utils/helpers');
const {
  normalizeRegionalRows,
  regionalSelectSql,
  summarizeQuality
} = require('../utils/regionalQuality');

function average(values) {
  const valid = values.map(num).filter(value => value !== null);
  return valid.length
    ? valid.reduce((total, value) => total + value, 0) / valid.length
    : null;
}

router.get('/', route('dashboard', async (req, res) => {
  const [[industryCount]] = await db.query(
    'SELECT COUNT(*) AS total FROM industry_labor_stats'
  );
  const [[regionalCount]] = await db.query(
    'SELECT COUNT(*) AS total FROM regional_labor_stats'
  );

  const [sourceRows] = await db.query(`
    SELECT
      r.region_id,
      r.region_name,
      g.gender_name,
      y.year_value,
      ${regionalSelectSql()}
    FROM regional_labor_stats s
    JOIN region r ON s.region_id = r.region_id
    JOIN gender g ON s.gender_id = g.gender_id
    JOIN \`year\` y ON s.year_id = y.year_id
    WHERE g.gender_name IN ('Male', 'Female', 'Total')
    ORDER BY r.region_id, y.year_value,
      FIELD(g.gender_name, 'Male', 'Female', 'Total')
  `);

  const { data: regionalTotals, issues } = normalizeRegionalRows(sourceRows);
  const latestYear = regionalTotals.reduce((latest, row) => {
    const year = Number(row.year_value);
    return Number.isFinite(year) ? Math.max(latest ?? year, year) : latest;
  }, null);
  const regions = latestYear === null
    ? []
    : regionalTotals
      .filter(row => Number(row.year_value) === latestYear)
      .map(row => ({
        region_name: row.region_name,
        employment_to_population_ratio: num(row.employment_to_population_ratio),
        unemployment_rate: num(row.unemployment_rate)
      }));

  const byYear = new Map();
  for (const row of regionalTotals) {
    const year = Number(row.year_value);
    if (!Number.isFinite(year)) continue;
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(row);
  }

  const trend = [...byYear.entries()]
    .sort(([yearA], [yearB]) => yearA - yearB)
    .map(([year, rows]) => ({
      year_value: year,
      avg_employment: average(rows.map(row => row.employment_to_population_ratio)),
      avg_unemployment: average(rows.map(row => row.unemployment_rate))
    }));

  const industryRecords = Number(industryCount.total);
  const regionalRecords = Number(regionalCount.total);

  res.json({
    success: true,
    database: 'south_korea_labor_market',
    industryRecords,
    regionalRecords,
    totalRecords: industryRecords + regionalRecords,
    latestYear,
    regions,
    trend,
    dataQuality: summarizeQuality(issues, regionalTotals.length)
  });
}));

module.exports = router;
