const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { toInt, route } = require('../utils/helpers');
const {
  normalizeRegionalRows,
  regionalSelectSql,
  summarizeQuality
} = require('../utils/regionalQuality');

router.get('/', route('unemployment', async (req, res) => {
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
      data: [],
      dataQuality: summarizeQuality([], 0)
    });
  }

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
      AND y.year_value = ?
    ORDER BY r.region_id, FIELD(g.gender_name, 'Male', 'Female', 'Total')
  `, [year]);

  const { data: totals, issues } = normalizeRegionalRows(sourceRows);
  const data = totals
    .map(row => ({
      region_id: row.region_id,
      region_name: row.region_name,
      year_value: row.year_value,
      unemployment_rate: row.unemployment_rate,
      economically_active_population: row.economically_active_population
    }))
    .sort((a, b) => (b.unemployment_rate ?? -Infinity) - (a.unemployment_rate ?? -Infinity));

  res.json({
    success: true,
    year,
    years,
    data,
    dataQuality: summarizeQuality(issues, data.length)
  });
}));

module.exports = router;
