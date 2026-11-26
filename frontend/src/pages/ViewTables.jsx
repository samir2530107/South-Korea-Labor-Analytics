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

  const chooseTable = name => {
    setSelected(name);
    setPage(1);
    setSearchInput('');
    setSearch('');
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
                ? `Showing ${from.toLocaleString()}??{to.toLocaleString()} of ${result.total.toLocaleString()} rows`
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

        {tableData.error ? (
          <ErrorBox message={tableData.error} onRetry={tableData.reload} />
        ) : !result ? (
          <Loader text="Loading rows..." />
        ) : (
          <>
            <div className={tableData.loading ? 'table-wrap fading' : 'table-wrap'}>
              <DataTable columns={result.columns} rows={result.rows} startIndex={startIndex} presorted />
            </div>

            <div className="pagination">
              <button type="button" className="btn" disabled={result.page <= 1} onClick={() => setPage(1)}>« First</button>
              <button type="button" className="btn" disabled={result.page <= 1} onClick={() => setPage(result.page - 1)}>??Prev</button>
              <span>Page {result.page} of {result.totalPages}</span>
              <button type="button" className="btn" disabled={result.page >= result.totalPages} onClick={() => setPage(result.page + 1)}>Next ??/button>
              <button type="button" className="btn" disabled={result.page >= result.totalPages} onClick={() => setPage(result.totalPages)}>Last »</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default ViewTables;
