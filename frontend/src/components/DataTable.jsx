function renderCell(value) {
  if (value === null || value === undefined) {
    return <span className="null-cell">NULL</span>;
  }
  return String(value);
}

function DataTable({ columns, rows, startIndex = 0 }) {
  if (!columns || columns.length === 0) {
    return <div className="empty-state">No rows to display.</div>;
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th className="row-number">#</th>
            {columns.map(column => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="table-empty">
                No matching rows.
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="row-number">{startIndex + rowIndex + 1}</td>
                {columns.map(column => (
                  <td key={column}>{renderCell(row[column])}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
