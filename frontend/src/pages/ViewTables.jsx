import { useEffect, useState } from 'react';

import DataTable from '../components/DataTable';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import useFetch from '../hooks/useFetch';
import { getTables, getTableData } from '../services/api';

// Read-only viewer: there are no add, edit or delete actions anywhere.
function ViewTables() {
  const tablesState = useFetch(getTables, []);
  const [selected, setSelected] = useState('');
  const [view, setView] = useState('readable');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  // Column group filter for industry_labor_stats: 'all' | 'overview' | 'wages' | 'hours' | 'days'
  const [colGroup, setColGroup] = useState('all');

  const tables = tablesState.data?.tables || [];
  const activeName = selected || tables[0]?.name || '';
  const activeInfo = tables.find(t => t.name === activeName);
  const effectiveView = activeInfo?.readable ? view : 'raw';

  // Wait 350 ms after typing before searching
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const tableData = useFetch(
    () => (activeName
      ? getTableData(activeName, { page, limit, search, view: effectiveView })
      : Promise.resolve(null)),
    [activeName, page, limit, search, effectiveView]
  );

  if (tablesState.loading && !tablesState.data) return <Loader text="Loading tables..." />;
  if (tablesState.error) return <ErrorBox message={tablesState.error} onRetry={tablesState.reload} />;

  const result = tableData.data;
  const startIndex = result ? (result.page - 1) * result.limit : 0;
  const from = result && result.total > 0 ? startIndex + 1 : 0;
  const to = result ? Math.min(startIndex + result.rows.length, result.total) : 0;

  // Dynamic column projection for industry stats to make it very easy to read
  const getVisibleColumns = (columns) => {
    if (!columns || activeName !== 'industry_labor_stats' || effectiveView !== 'readable') {
      return columns;
    }
    const base = ['year_value', 'industry_name', 'size_category'];
    if (colGroup === 'overview') {
      return [...base, 'total_days_worked', 'total_hours_worked', 'total_wages', 'permanent_employee_wages'];
    }
    if (colGroup === 'wages') {
      return [...base, 'total_wages', 'permanent_employee_wages', 'regular_wages', 'overtime_wages', 'special_wages', 'temporary_daily_employee_wages'];
    }
    if (colGroup === 'hours') {
      return [...base, 'total_hours_worked', 'permanent_employee_hours_worked', 'regular_hours_worked', 'overtime_hours_worked', 'temporary_daily_employee_hours_worked'];
    }
    if (colGroup === 'days') {
      return [...base, 'total_days_worked', 'permanent_employee_days_worked', 'temporary_daily_employee_days_worked'];
    }
    return columns;
  };

  const visibleColumns = result ? getVisibleColumns(result.columns) : [];

  const chooseTable = name => {
    setSelected(name);
    setPage(1);
    setSearchInput('');
    setSearch('');
    setColGroup('all');
  };

  return (
    <div className="page-content">
      <div className="welcome-section">
        <h2>Database Tables</h2>
        <p>
          Browse every table in <strong>South Korea Labor Market</strong>.
          View only: rows are shown in ID order and cannot be changed here.
        </p>
      </div>

      <div className="table-tabs">
        {tables.map(table => (
          <button
            key={table.name}
            type="button"
            className={`table-tab ${table.name === activeName ? 'active' : ''}`}
            onClick={() => chooseTable(table.name)}
          >
            <span>{table.label || table.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
            <small>{table.rows.toLocaleString()} rows</small>
          </button>
        ))}
      </div>

      <section className="chart-card">
        <div className="table-toolbar">
          <div>
            <h3>{activeInfo?.label ?? activeName}</h3>
            <p>
              {result
                ? `Showing ${from.toLocaleString()}\u2013${to.toLocaleString()} of ${result.total.toLocaleString()} rows`
                : 'Loading...'}
              <span className="readonly-badge">READ ONLY</span>
            </p>
          </div>

          <div className="toolbar-controls">
            {activeInfo?.readable && (
              <div className="segmented">
                <button type="button" className={effectiveView === 'readable' ? 'on' : ''} onClick={() => { setView('readable'); setPage(1); }}>
                  Readable
                </button>
                <button type="button" className={effectiveView === 'raw' ? 'on' : ''} onClick={() => { setView('raw'); setPage(1); }}>
                  Raw IDs
                </button>
              </div>
            )}

            <input
              className="search-input"
              type="search"
              placeholder="Search this table..."
              value={searchInput}
              onChange={event => setSearchInput(event.target.value)}
            />

            <select
              className="limit-select"
              value={limit}
              onChange={event => { setLimit(Number(event.target.value)); setPage(1); }}
            >
              {[10, 25, 50, 100].map(n => (
                <option key={n} value={n}>{n} per page</option>
              ))}
            </select>
          </div>
        </div>

        {activeName === 'regional_labor_stats' && effectiveView === 'readable' && (
          <div className="table-description-banner">
            <strong>Regional Labor Statistics Survey Structure (from Economically Active Population Survey):</strong>
            <ul>
              <li><strong>Data Flow:</strong> Grouped chronologically by Year, then by Region (Seoul, Gwangju, Busan, Daegu, Incheon, Daejeon, Ulsan).</li>
              <li><strong>Gender Breakdown &amp; Total:</strong> Each region contains <strong>Male</strong>, <strong>Female</strong>, followed by the aggregated <strong>Total</strong> (Male + Female) of that region for the same year.</li>
              <li><strong>Units:</strong> Population counts are recorded in <em>Thousand Persons</em>, and participation/employment/unemployment rates are in <em>percentages (%)</em>.</li>
            </ul>
          </div>
        )}

        {activeName === 'industry_labor_stats' && effectiveView === 'readable' && (
          <div className="table-description-banner">
            <div className="banner-title-row">
              <strong>Industry Labor Statistics Survey Structure (Survey on Labor Conditions by Employment Type):</strong>
              <div className="column-group-filter">
                <span className="filter-hint">Quick View:</span>
                <button type="button" className={`pill-btn ${colGroup === 'all' ? 'active' : ''}`} onClick={() => setColGroup('all')}>All Columns</button>
                <button type="button" className={`pill-btn ${colGroup === 'overview' ? 'active' : ''}`} onClick={() => setColGroup('overview')}>Key Summary</button>
                <button type="button" className={`pill-btn ${colGroup === 'wages' ? 'active' : ''}`} onClick={() => setColGroup('wages')}>Wages Focus</button>
                <button type="button" className={`pill-btn ${colGroup === 'hours' ? 'active' : ''}`} onClick={() => setColGroup('hours')}>Working Hours</button>
                <button type="button" className={`pill-btn ${colGroup === 'days' ? 'active' : ''}`} onClick={() => setColGroup('days')}>Working Days</button>
              </div>
            </div>
            <ul>
              {colGroup === 'wages' && (
                <>
                  <li><strong>Total Wages (All Workers):</strong> The monthly average pay across <strong>all</strong> workers (permanent + temporary &amp; daily). Because temporary/daily workers usually earn less, this overall average is <strong>lower</strong> than the permanent-only sum.</li>
                  <li><strong>Permanent Employee Wages:</strong> The monthly average pay for <strong>permanent workers only</strong>, which equals <strong>Regular Wages + Overtime Wages + Special Wages</strong>.</li>
                </>
              )}
              {colGroup === 'hours' && (
                <>
                  <li><strong>Total Hours Worked (All Workers):</strong> The monthly average hours worked across <strong>all</strong> workers (permanent + temporary &amp; daily). Because temporary/daily workers work fewer hours on average, this overall average is <strong>lower</strong> than the permanent-only sum.</li>
                  <li><strong>Permanent Employee Hours:</strong> The monthly average hours for <strong>permanent workers only</strong>, which equals <strong>Regular Hours + Overtime Hours</strong>.</li>
                </>
              )}
              {colGroup === 'days' && (
                <>
                  <li><strong>Total Days Worked (All Workers):</strong> The average monthly working days per worker across <strong>all</strong> workers (permanent + temporary &amp; daily).</li>
                  <li><strong>Permanent vs. Temporary/Daily Days:</strong> Compares average monthly working days for permanent staff against temporary &amp; daily workers.</li>
                </>
              )}
              {colGroup === 'overview' && (
                <>
                  <li><strong>Key Summary View:</strong> Shows the main monthly per-worker averages (<strong>Total Days</strong>, <strong>Total Hours</strong>, <strong>Total Wages</strong>, and <strong>Permanent Employee Wages</strong>) side-by-side at a glance.</li>
                  <li><strong>Why is Total Wages lower than Permanent Employee Wages?</strong> <em>Total Wages</em> averages <strong>all</strong> workers (including temporary &amp; daily workers), while <em>Permanent Employee Wages</em> covers regular full-time staff only.</li>
                  <li><strong>Tip:</strong> Click <strong>Wages Focus</strong>, <strong>Working Hours</strong>, or <strong>Working Days</strong> above to see the detailed breakdowns.</li>
                </>
              )}
              {colGroup === 'all' && (
                <>
                  <li><strong>What is &ldquo;Total&rdquo; Industry?</strong> The national aggregate across all surveyed non-agricultural commercial industries in South Korea.</li>
                  <li><strong>What is &ldquo;Total (1 permanent employee or more)&rdquo;?</strong> The combined aggregate across all surveyed business establishment sizes with at least 1 regular worker.</li>
                  <li><strong>Sub-categories:</strong> Compare enterprise scale tiers (&minus;10, &minus;30, and 300+ permanent workers) against working hours (Regular/Overtime), working days, and monthly wage levels (in KRW Won).</li>
                </>
              )}
            </ul>
          </div>
        )}

        {tableData.error ? (
          <ErrorBox message={tableData.error} onRetry={tableData.reload} />
        ) : !result ? (
          <Loader text="Loading rows..." />
        ) : (
          <>
            <div className={tableData.loading ? 'table-wrap fading' : 'table-wrap'}>
              <DataTable columns={visibleColumns} rows={result.rows} startIndex={startIndex} presorted />
            </div>

            <div className="pagination">
              <button type="button" className="btn" disabled={result.page <= 1} onClick={() => setPage(1)}>&laquo; First</button>
              <button type="button" className="btn" disabled={result.page <= 1} onClick={() => setPage(result.page - 1)}>&lsaquo; Prev</button>
              <span>Page {result.page} of {result.totalPages}</span>
              <button type="button" className="btn" disabled={result.page >= result.totalPages} onClick={() => setPage(result.page + 1)}>Next &rsaquo;</button>
              <button type="button" className="btn" disabled={result.page >= result.totalPages} onClick={() => setPage(result.totalPages)}>Last &raquo;</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default ViewTables;
