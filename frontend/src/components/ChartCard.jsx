function ChartCard({ title, subtitle, children, height = 400, empty = false, emptyText = 'No data available for this selection.' }) {
  return (
    <section className="chart-card">
      <div className="chart-card-header">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      {empty ? (
        <div className="empty-state">{emptyText}</div>
      ) : (
        <div className="chart-container" style={{ height }}>
          {children}
        </div>
      )}
    </section>
  );
}

export default ChartCard;
