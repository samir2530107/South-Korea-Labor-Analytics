
// All known column → human-readable label mappings matching official government statistical surveys
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
  size_category: 'Establishment Size',
  industry_name: 'Industry',
  population_15_plus: 'Population 15+ (Thousand Person)',
  economically_active_population: 'Economically Active Population (Thousand Person)',
  economically_inactive_population: 'Economically Inactive Population (Thousand Person)',
  employed_population: 'Employed Population (Thousand Person)',
  unemployed_population: 'Unemployed Population (Thousand Person)',
  labor_force_participation_rate: 'Labor Force Participation Rate (%)',
  employment_to_population_ratio: 'Employment-to-Population Ratio (%)',
  employment_to_population_ratio_15_64: 'Employment-to-Population Ratio (15~64) (%)',
  unemployment_rate: 'Unemployment Rate (%)',
  employment_rate: 'Employment Rate (%)',
  // Industry survey metrics (Days, Hours, Wages in KRW Won)
  total_days_worked: 'Total Days Worked (Day)',
  permanent_employee_days_worked: 'Days Worked: Permanent Employees (Day)',
  temporary_daily_employee_days_worked: 'Days Worked: Temp & Daily Employees (Day)',
  total_hours_worked: 'Total Hours Worked (Hour)',
  permanent_employee_hours_worked: 'Hours Worked: Permanent Employees (Hour)',
  regular_hours_worked: 'Regular Hours Worked: Permanent (Hour)',
  overtime_hours_worked: 'Overtime Hours Worked: Permanent (Hour)',
  temporary_daily_employee_hours_worked: 'Hours Worked: Temp & Daily (Hour)',
  total_wages: 'Total Wages (Won)',
  permanent_employee_wages: 'Total Wages: Permanent Employees (Won)',
  regular_wages: 'Regular Wages: Permanent (Won)',
  overtime_wages: 'Overtime Wages: Permanent (Won)',
  special_wages: 'Special Wages: Permanent (Won)',
  temporary_daily_employee_wages: 'Total Wages: Temp & Daily (Won)'
};

// Columns where values are rates/ratios — append % if numeric
const RATE_COLS = new Set([
  'labor_force_participation_rate',
  'employment_to_population_ratio',
  'unemployment_rate',
  'employment_rate'
]);

function formatColumnName(col) {
  if (COLUMN_LABELS[col]) return COLUMN_LABELS[col];
  return col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Columns formatted as currency in KRW (Won)
const WON_COLS = new Set([
  'total_wages',
  'permanent_employee_wages',
  'regular_wages',
  'overtime_wages',
  'special_wages',
  'temporary_daily_employee_wages'
]);

// Strip underscores from string display values
function cleanValue(value) {
  if (typeof value === 'string') return value.replace(/_/g, ' ');
  return value;
}

function renderCell(column, value) {
  if (value === null || value === undefined) {
    return <span className="null-cell">—</span>;
  }
  const cleaned = cleanValue(value);
  if (RATE_COLS.has(column) && typeof value === 'number') {
    return `${cleaned}%`;
  }
  if (WON_COLS.has(column) && !isNaN(Number(value))) {
    return `₩${Number(value).toLocaleString()}`;
  }
  if (typeof value === 'number') {
    return Number(value).toLocaleString();
  }
  if (column === 'size_category' && typeof cleaned === 'string') {
    return cleaned.trim();
  }
  return String(cleaned);
}

// DataTable accepts an optional `presorted` prop.
// When true (ViewTables paginated view), we trust the backend order and do NOT re-sort.
// When false (default), we sort so Male → Female → Total appear together per region+year.
function sortWithTotals(columns, rows) {
  if (!columns.includes('gender_name') || !columns.includes('region_name')) return rows;
  const ORDER = { Male: 0, Female: 1, Total: 2 };
  return [...rows].sort((a, b) => {
    const rCmp = String(a.region_name ?? '').localeCompare(String(b.region_name ?? ''));
    if (rCmp !== 0) return rCmp;
    const yCmp = (a.year_value ?? 0) - (b.year_value ?? 0);
    if (yCmp !== 0) return yCmp;
    const ga = ORDER[String(a.gender_name).trim()] ?? 99;
    const gb = ORDER[String(b.gender_name).trim()] ?? 99;
    return ga - gb;
  });
}

function DataTable({ columns, rows, startIndex = 0, presorted = false }) {
  if (!columns || columns.length === 0) {
    return <div className="empty-state">No rows to display.</div>;
  }

  const displayRows = presorted ? rows : sortWithTotals(columns, rows);
  const hasGender = columns.includes('gender_name');
  const hasIndustry = columns.includes('industry_name');
  const hasSize = columns.includes('size_category');

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th className="row-number">#</th>
            {columns.map(col => (
              <th key={col}>{formatColumnName(col)}</th>
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
            displayRows.map((row, i) => {
              const genderVal = String(row.gender_name ?? '').trim();
              const isGenderTotal = hasGender && (genderVal === 'Total' || genderVal.replace(/_/g, ' ') === 'Total');
              const isMale = hasGender && genderVal === 'Male';
              const isFemale = hasGender && genderVal === 'Female';

              // Industry total identification
              const indVal = String(row.industry_name ?? '').trim();
              const sizeVal = String(row.size_category ?? '').trim();
              const isIndustryTotal = hasIndustry && indVal === 'Total';
              const isSizeTotal = hasSize && (sizeVal.startsWith('Total') || sizeVal.includes('1 permanent employee or more'));
              const isIndOrSizeTotal = isIndustryTotal || isSizeTotal;

              const isTotal = isGenderTotal || isIndOrSizeTotal;

              let rowClass = '';
              if (isGenderTotal) rowClass = 'row-total';
              else if (isMale) rowClass = 'row-male';
              else if (isFemale) rowClass = 'row-female';
              else if (isIndustryTotal) rowClass = 'row-total row-ind-total';
              else if (isSizeTotal) rowClass = 'row-size-total';

              return (
                <tr key={i} className={rowClass}>
                  <td className="row-number">{startIndex + i + 1}</td>
                  {columns.map(col => (
                    <td key={col}>{renderCell(col, row[col])}</td>
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
