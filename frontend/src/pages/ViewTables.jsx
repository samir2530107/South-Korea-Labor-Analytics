import { useEffect, useState } from 'react';

import DataQualityNotice from '../components/DataQualityNotice';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import useFetch from '../hooks/useFetch';
import { getTables, getTableData } from '../services/api';

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
  const activeInfo = tables.find(table => table.name === activeName);
  const effectiveView = activeInfo?.readable ? view : 'raw';

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const tableData = useFetch(
    () => (activeName
      ? getTableData(activeName, { page, limit, search, view: effectiveView })
      : Promise.resolve(null)),
    [activeName, page, limit, search, effectiveView]
  );

  if (tablesState.loading && !tablesState.data) return <Loader text="Loading database tables..." />;
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
      <section className="welcome-section">
        <div className="welcome-copy">
          <span className="eyebrow">DATA EXPLORER</span>
          <h2>Browse the source tables</h2>
          <p>
            Search and page through the database. This view is read-only; it never changes
            the source records.
          </p>
        </div>
      </section>

      {tables.length === 0 ? (
        <div className="empty-state">No database tables are available yet.</div>
      ) : (
        <>
          <div className="table-tabs" role="tablist" aria-label="Database tables">
            {tables.map(table => (
              <button
                key={table.name}
                type="button"
                role="tab"
                aria-selected={table.name === activeName}
                className={`table-tab ${table.name === activeName ? 'active' : ''}`}
                onClick={() => chooseTable(table.name)}
              >
                <span>{table.label || table.name.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase())}</span>
                <small>{Number(table.rows).toLocaleString()} rows</small>
              </button>
            ))}
          </div>

          <section className="chart-card">
            <div className="table-toolbar">
              <div className="table-heading">
                <h3>{activeInfo?.label ?? activeName}</h3>
                <p>
                  {result
                    ? `Showing ${from.toLocaleString()}–${to.toLocaleString()} of ${result.total.toLocaleString()} rows`
                    : 'Loading rows…'}
                  <span className="readonly-badge">READ ONLY</span>
                </p>
              </div>

              <div className="toolbar-controls">
                {activeInfo?.readable && (
                  <div className="segmented" role="group" aria-label="Table display mode">
                    <button
                      type="button"
                      aria-pressed={effectiveView === 'readable'}
                      className={effectiveView === 'readable' ? 'on' : ''}
                      onClick={() => { setView('readable'); setPage(1); }}
                    >
                      Readable
                    </button>
                    <button
                      type="button"
                      aria-pressed={effectiveView === 'raw'}
                      className={effectiveView === 'raw' ? 'on' : ''}
                      onClick={() => { setView('raw'); setPage(1); }}
                    >
                      Raw IDs
                    </button>
                  </div>
                )}

                <label className="search-control">
                  <span className="visually-hidden">Search this table</span>
                  <input
                    className="search-input"
                    type="search"
                    placeholder="Search this table…"
                    value={searchInput}
                    onChange={event => setSearchInput(event.target.value)}
                  />
                </label>

                <label className="limit-control">
                  <span className="visually-hidden">Rows per page</span>
                  <select
                    className="limit-select"
                    value={limit}
                    onChange={event => { setLimit(Number(event.target.value)); setPage(1); }}
                  >
                    {[10, 25, 50, 100].map(value => (
                      <option key={value} value={value}>{value} per page</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {tableData.error ? (
              <ErrorBox message={tableData.error} onRetry={tableData.reload} />
            ) : !result ? (
              <Loader text="Loading rows..." />
            ) : (
              <>
                {result.dataQuality && (
                  <DataQualityNotice dataQuality={result.dataQuality} scope="the readable regional table" />
                )}
                <div className={tableData.loading ? 'table-wrap fading' : 'table-wrap'}>
                  <DataTable
                    columns={result.columns}
                    rows={result.rows}
                    startIndex={startIndex}
                    presorted
                  />
                </div>

                <nav className="pagination" aria-label="Table pagination">
                  <button
                    type="button"
                    className="btn"
                    disabled={result.page <= 1}
                    onClick={() => setPage(1)}
                  >
                    First
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={result.page <= 1}
                    onClick={() => setPage(result.page - 1)}
                  >
                    Previous
                  </button>
                  <span aria-live="polite">Page {result.page} of {result.totalPages}</span>
                  <button
                    type="button"
                    className="btn"
                    disabled={result.page >= result.totalPages}
                    onClick={() => setPage(result.page + 1)}
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={result.page >= result.totalPages}
                    onClick={() => setPage(result.totalPages)}
                  >
                    Last
                  </button>
                </nav>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default ViewTables;
