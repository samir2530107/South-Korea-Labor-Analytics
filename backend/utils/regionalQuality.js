const COUNT_FIELDS = [
  { key: 'population_15_plus', label: 'Population 15+', unit: 'thousand persons' },
  { key: 'economically_active_population', label: 'Economically active population', unit: 'thousand persons' },
  { key: 'economically_inactive_population', label: 'Economically inactive population', unit: 'thousand persons' },
  { key: 'employed_population', label: 'Employed population', unit: 'thousand persons' },
  { key: 'unemployed_population', label: 'Unemployed population', unit: 'thousand persons' }
];

const RATE_FIELDS = [
  {
    key: 'labor_force_participation_rate',
    label: 'Labor force participation rate',
    numerator: 'economically_active_population',
    denominator: 'population_15_plus'
  },
  {
    key: 'employment_to_population_ratio',
    label: 'Employment-to-population ratio',
    numerator: 'employed_population',
    denominator: 'population_15_plus'
  },
  {
    key: 'unemployment_rate',
    label: 'Unemployment rate',
    numerator: 'unemployed_population',
    denominator: 'economically_active_population'
  }
];

const REGIONAL_FIELDS = [
  ...COUNT_FIELDS.map(field => field.key),
  ...RATE_FIELDS.map(field => field.key)
];

const COUNT_ABSOLUTE_TOLERANCE = 2;
const COUNT_RELATIVE_TOLERANCE = 0.001;
const RATE_TOLERANCE = 0.5;
const MAX_ISSUES_IN_RESPONSE = 20;

function numeric(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function normalizeGender(value) {
  return String(value ?? '').trim().replace(/_/g, ' ').toLowerCase();
}

function groupKey(row) {
  const regionKey = row.region_id ?? row.region_name ?? 'unknown';
  return `${regionKey}\u0000${row.year_value ?? ''}`;
}

function addIssue(issues, row, field, sourceValue, validatedValue, method, unit) {
  const metadata = [...COUNT_FIELDS, ...RATE_FIELDS].find(item => item.key === field);
  issues.push({
    region_id: row.region_id ?? null,
    region_name: row.region_name ?? 'Unknown region',
    year_value: numeric(row.year_value) ?? row.year_value ?? null,
    metric: field,
    metricLabel: metadata?.label ?? field,
    sourceValue: sourceValue === null ? null : round(sourceValue),
    validatedValue: round(validatedValue),
    difference: sourceValue === null ? null : round(sourceValue - validatedValue),
    unit,
    method
  });
}

/**
 * Build one Total-gender record for each region/year. Materially inconsistent
 * totals are reconciled from the Male + Female records. Rates are recalculated
 * from the reconciled population counts; the source database is never changed.
 */
function normalizeRegionalRows(rows) {
  const groups = new Map();

  for (const row of rows) {
    const key = groupKey(row);
    if (!groups.has(key)) {
      groups.set(key, {
        region_id: row.region_id ?? null,
        region_name: row.region_name ?? 'Unknown region',
        year_value: numeric(row.year_value) ?? row.year_value ?? null,
        male: null,
        female: null,
        total: null
      });
    }

    const group = groups.get(key);
    const gender = normalizeGender(row.gender_name);
    if (gender === 'male') group.male = row;
    if (gender === 'female') group.female = row;
    if (gender === 'total') group.total = row;
  }

  const data = [];
  const issues = [];

  for (const group of groups.values()) {
    const { male, female, total } = group;
    const base = total ?? male ?? female ?? {};
    const normalized = {
      region_id: group.region_id,
      region_name: group.region_name,
      year_value: group.year_value,
      gender_name: 'Total'
    };

    for (const field of COUNT_FIELDS) {
      const sourceValue = numeric(total?.[field.key]);
      const maleValue = numeric(male?.[field.key]);
      const femaleValue = numeric(female?.[field.key]);

      if (maleValue !== null && femaleValue !== null) {
        const validatedValue = round(maleValue + femaleValue);
        const tolerance = Math.max(
          COUNT_ABSOLUTE_TOLERANCE,
          Math.abs(validatedValue) * COUNT_RELATIVE_TOLERANCE
        );

        if (sourceValue === null || Math.abs(sourceValue - validatedValue) > tolerance) {
          normalized[field.key] = validatedValue;
          addIssue(
            issues,
            { ...group, ...base },
            field.key,
            sourceValue,
            validatedValue,
            'Male + Female',
            field.unit
          );
        } else {
          normalized[field.key] = sourceValue;
        }
      } else {
        normalized[field.key] = sourceValue;
      }
    }

    for (const field of RATE_FIELDS) {
      const sourceValue = numeric(total?.[field.key]);
      const numerator = numeric(normalized[field.numerator]);
      const denominator = numeric(normalized[field.denominator]);
      const validatedValue = numerator !== null && denominator !== null && denominator > 0
        ? round((numerator / denominator) * 100)
        : null;

      if (validatedValue !== null && (
        sourceValue === null || Math.abs(sourceValue - validatedValue) > RATE_TOLERANCE
      )) {
        normalized[field.key] = validatedValue;
        addIssue(
          issues,
          { ...group, ...base },
          field.key,
          sourceValue,
          validatedValue,
          `${field.numerator} ÷ ${field.denominator} × 100`,
          '%'
        );
      } else {
        normalized[field.key] = sourceValue;
      }
    }

    data.push(normalized);
  }

  data.sort((a, b) => {
    const regionOrder = numeric(a.region_id) - numeric(b.region_id);
    if (Number.isFinite(regionOrder) && regionOrder !== 0) return regionOrder;
    const nameOrder = String(a.region_name).localeCompare(String(b.region_name));
    if (nameOrder !== 0) return nameOrder;
    return (numeric(a.year_value) ?? 0) - (numeric(b.year_value) ?? 0);
  });

  return { data, issues };
}

function summarizeQuality(issues = [], checkedRegions = 0) {
  const correctionCount = issues.length;
  return {
    status: correctionCount > 0 ? 'reconciled' : 'verified',
    checkedRegions,
    correctionCount,
    issues: issues.slice(0, MAX_ISSUES_IN_RESPONSE),
    omittedIssueCount: Math.max(correctionCount - MAX_ISSUES_IN_RESPONSE, 0)
  };
}

function regionalSelectSql(alias = 's') {
  return REGIONAL_FIELDS.map(field => `${alias}.${field}`).join(',\n      ');
}

module.exports = {
  COUNT_FIELDS,
  RATE_FIELDS,
  REGIONAL_FIELDS,
  normalizeGender,
  normalizeRegionalRows,
  summarizeQuality,
  regionalSelectSql
};
