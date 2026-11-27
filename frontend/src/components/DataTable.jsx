import { formatNumber } from '../utils/chartUtils';

const COLUMN_LABELS = {
  region_id: 'ID',
  gender_id: 'ID',
  year_id: 'ID',
  industry_id: 'ID',
  size_id: 'ID',
  stat_id: 'ID',
  region_name: 'Region',
  gender_name: 'Gender',
  year_value: 'Year',
  size_category: 'Establishment size',
  industry_name: 'Industry',
  population_15_plus: 'Population 15+ (thousand persons)',
  economically_active_population: 'Economically active population (thousand persons)',
  economically_inactive_population: 'Economically inactive population (thousand persons)',
  employed_population: 'Employed population (thousand persons)',
  unemployed_population: 'Unemployed population (thousand persons)',
  total_wages: 'Total wages (Won / worker / month)',
  total_hours_worked: 'Total hours worked (hours / worker / month)',
  regular_hours_worked: 'Regular hours (hours / worker / month)',
  overtime_hours_worked: 'Overtime hours (hours / worker / month)',
  total_days_worked: 'Total days worked (days / worker / month)',

  labor_force_participation_rate: 'Labor force participation rate (%)',
  employment_to_population_ratio: 'Employment-to-population ratio (%)',
  unemployment_rate: 'Unemployment rate (%)',
  employment_rate: 'Employment rate (%)'
};

const RATE_COLUMNS = new Set([
  'labor_force_participation_rate',
  'employment_to_population_ratio',
  'unemployment_rate',
  'employment_rate'
]);

const CURRENCY_COLUMNS = new Set(['total_wages']);

const ONE_DECIMAL_COLUMNS = new Set([
  'total_hours_worked',
  'regular_hours_worked',
  'overtime_hours_worked',
  'total_days_worked'
]);

const NUMERIC_COLUMNS = new Set([
  'population_15_plus',
  'economically_active_population',
  'economically_inactive_population',
  'employed_population',
  'unemployed_population',
  'total_wages',
  'total_hours_worked',
  'regular_hours_worked',
  'overtime_hours_worked',
  'total_days_worked'
]);

function formatColumnName(column) {
  if (COLUMN_LABELS[column]) return COLUMN_LABELS[column];
  return column.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
}

function cleanValue(value) {
  return typeof value === 'string' ? value.replace(/_/g, ' ') : value;
}

function numericValue(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function renderCell(column, value) {
  if (value === null || value === undefined || value === '') {
    return <span className="null-cell">Not available</span>;
  }

  const cleaned = cleanValue(value);
  const numeric = numericValue(value);
  if (RATE_COLUMNS.has(column) && numeric !== null) {
    return `${formatNumber(numeric, 2)}%`;
  }
  if (CURRENCY_COLUMNS.has(column) && numeric !== null) {
    return `₩${formatNumber(numeric, 0)}`;
  }
  if (NUMERIC_COLUMNS.has(column) && numeric !== null) {
    return formatNumber(numeric, ONE_DECIMAL_COLUMNS.has(column) ? 1 : 2);
  }
  return String(cleaned);
}

function sortWithTotals(columns, rows) {
  if (!columns.includes('gender_name') || !columns.includes('region_name')) return rows;
  const genderOrder = { male: 0, female: 1, total: 2 };

  return [...rows].sort((a, b) => {
    const regionOrder = String(a.region_name ?? '').localeCompare(String(b.region_name ?? ''));
    if (regionOrder !== 0) return regionOrder;

    const yearOrder = (numericValue(a.year_value) ?? 0) - (numericValue(b.year_value) ?? 0);
    if (yearOrder !== 0) return yearOrder;

    const genderA = String(a.gender_name ?? '').trim().replace(/_/g, ' ').toLowerCase();
    const genderB = String(b.gender_name ?? '').trim().replace(/_/g, ' ').toLowerCase();
    return (genderOrder[genderA] ?? 99) - (genderOrder[genderB] ?? 99);
  });
}

function DataTable({ columns, rows, startIndex = 0, presorted = false }) {
  if (!columns || columns.length === 0) {
    return <div className="empty-state">No rows to display.</div>;
  }

  const safeRows = Array.isArray(rows) ? rows : [];
  const displayRows = presorted ? safeRows : sortWithTotals(columns, safeRows);
  const hasGender = columns.includes('gender_name');

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th className="row-number" scope="col">#</th>
            {columns.map(column => (
              <th key={column} scope="col">{formatColumnName(column)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="table-empty">
                No matching rows found.
              </td>
            </tr>
          ) : (
            displayRows.map((row, index) => {
              const gender = String(row.gender_name ?? '').trim().replace(/_/g, ' ').toLowerCase();
              const isTotal = hasGender && gender === 'total';
              const isMale = hasGender && gender === 'male';
              return (
                <tr key={row.stat_id ?? `${row.region_name ?? ''}-${row.year_value ?? ''}-${gender}-${index}`} className={isTotal ? 'row-total' : isMale ? 'row-male' : ''}>
                  <td className="row-number">{startIndex + index + 1}</td>
                  {columns.map(column => (
                    <td key={column}>{renderCell(column, row[column])}</td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
