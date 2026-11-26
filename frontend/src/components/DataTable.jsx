
// All known column → human-readable label mappings
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
  unemployment_rate: 'Unemployment Rate (%)',
  employment_rate: 'Employment Rate (%)',
  total_wages: 'Total Wages',
  total_hours_worked: 'Total Hours Worked',
  regular_hours_worked: 'Regular Hours Worked',
  overtime_hours_worked: 'Overtime Hours Worked',
  total_days_worked: 'Total Days Worked'
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
              const isTotal = hasGender && (genderVal === 'Total' || genderVal.replace(/_/g, ' ') === 'Total');
              const isMale = hasGender && genderVal === 'Male';
              return (
                <tr key={i} className={isTotal ? 'row-total' : isMale ? 'row-male' : ''}>
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
