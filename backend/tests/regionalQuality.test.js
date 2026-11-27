const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeRegionalRows,
  summarizeQuality
} = require('../utils/regionalQuality');

function makeRow(gender_name, values, region_name = 'Seoul', year_value = 2000) {
  return {
    region_id: 1,
    region_name,
    gender_name,
    year_value,
    ...values
  };
}

const male = {
  population_15_plus: 4000,
  economically_active_population: 2500,
  economically_inactive_population: 1500,
  employed_population: 2400,
  unemployed_population: 100
};

const female = {
  population_15_plus: 4200,
  economically_active_population: 2200,
  economically_inactive_population: 2000,
  employed_population: 2100,
  unemployed_population: 100
};

test('reconciles a materially incorrect Seoul 2000 Total from Male + Female counts', () => {
  const rows = [
    makeRow('Male', male),
    makeRow('Female', female),
    makeRow('Total', {
      population_15_plus: 8000,
      economically_active_population: 4700,
      economically_inactive_population: 3500,
      employed_population: 4500,
      unemployed_population: 200,
      labor_force_participation_rate: 58.75,
      employment_to_population_ratio: 56.25,
      unemployment_rate: 4.26
    })
  ];

  const { data, issues } = normalizeRegionalRows(rows);
  const total = data[0];

  assert.equal(data.length, 1);
  assert.equal(total.region_name, 'Seoul');
  assert.equal(total.year_value, 2000);
  assert.equal(total.population_15_plus, 8200);
  assert.equal(total.employment_to_population_ratio, 54.88);
  assert.equal(issues.some(issue => issue.metric === 'population_15_plus'), true);
  assert.equal(issues.some(issue => issue.metric === 'employment_to_population_ratio'), true);
  assert.equal(issues.every(issue => issue.region_name === 'Seoul' && issue.year_value === 2000), true);
});

test('leaves already consistent totals unchanged', () => {
  const rows = [
    makeRow('Male', male, 'Ulsan'),
    makeRow('Female', female, 'Ulsan'),
    makeRow('Total', {
      population_15_plus: 8201,
      economically_active_population: 4700,
      economically_inactive_population: 3500,
      employed_population: 4500,
      unemployed_population: 200,
      labor_force_participation_rate: 57.3,
      employment_to_population_ratio: 54.9,
      unemployment_rate: 4.3
    }, 'Ulsan')
  ];

  const { data, issues } = normalizeRegionalRows(rows);
  assert.equal(data[0].population_15_plus, 8201);
  assert.equal(data[0].employment_to_population_ratio, 54.9);
  assert.equal(issues.length, 0);
});

test('fills missing Total values when both gender rows are present', () => {
  const rows = [
    makeRow('Male', male, 'Busan', 2001),
    makeRow('Female', female, 'Busan', 2001),
    makeRow('Total', { population_15_plus: null }, 'Busan', 2001)
  ];

  const { data, issues } = normalizeRegionalRows(rows);
  assert.equal(data[0].population_15_plus, 8200);
  assert.equal(data[0].economically_active_population, 4700);
  assert.equal(issues.some(issue => issue.metric === 'population_15_plus'), true);
});

test('summarizes adjustments without returning an unbounded issue list', () => {
  const issues = Array.from({ length: 25 }, (_, index) => ({ metric: `field_${index}` }));
  const summary = summarizeQuality(issues, 7);

  assert.equal(summary.status, 'reconciled');
  assert.equal(summary.checkedRegions, 7);
  assert.equal(summary.correctionCount, 25);
  assert.equal(summary.issues.length, 20);
  assert.equal(summary.omittedIssueCount, 5);
});
