const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { toInt, route } = require('../utils/helpers');
const {
  normalizeRegionalRows,
  regionalSelectSql,
  summarizeQuality
} = require('../utils/regionalQuality');

async function regionalYears() {
  const [rows] = await db.query(`
    SELECT DISTINCT y.year_value
    FROM regional_labor_stats s
    JOIN \`year\` y ON s.year_id = y.year_id
    ORDER BY y.year_value DESC
  `);

  return rows.map(row => row.year_value);
}

function regionalSourceSql(whereClause = '') {
  return `
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
      ${whereClause}
    ORDER BY r.region_id, y.year_value,
      FIELD(g.gender_name, 'Male', 'Female', 'Total')
  `;
}

function publicRows(rows) {
  return rows.map(row => ({
    region_name: row.region_name,
    year_value: row.year_value,
    population_15_plus: row.population_15_plus,
    economically_active_population: row.economically_active_population,
    economically_inactive_population: row.economically_inactive_population,
    employed_population: row.employed_population,
    unemployed_population: row.unemployed_population,
    employment_to_population_ratio: row.employment_to_population_ratio,
    labor_force_participation_rate: row.labor_force_participation_rate,
    unemployment_rate: row.unemployment_rate
  }));
}

router.get('/years', route('regional years', async (req, res) => {
  const years = await regionalYears();

  res.json({
    success: true,
    years,
    latestYear: years[0] ?? null
  });
}));

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
      data: [],
      dataQuality: summarizeQuality([], 0)
    });
  }

  const [sourceRows] = await db.query(regionalSourceSql('AND y.year_value = ?'), [year]);
  const { data: totals, issues } = normalizeRegionalRows(sourceRows);
  const sorted = [...totals].sort((a, b) => {
    const difference = (b.employment_to_population_ratio ?? -Infinity)
      - (a.employment_to_population_ratio ?? -Infinity);
    if (difference !== 0) return difference;
    return (a.region_id ?? 0) - (b.region_id ?? 0);
  });

  res.json({
    success: true,
    year,
    data: publicRows(sorted),
    dataQuality: summarizeQuality(issues, sorted.length)
  });
}));

router.get('/trend', route('regional trend', async (req, res) => {
  const [sourceRows] = await db.query(regionalSourceSql());
  const { data, issues } = normalizeRegionalRows(sourceRows);

  res.json({
    success: true,
    data: publicRows(data),
    dataQuality: summarizeQuality(issues, data.length)
  });
}));

module.exports = router;
