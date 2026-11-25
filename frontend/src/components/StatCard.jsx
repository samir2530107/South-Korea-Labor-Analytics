function StatCard({ title, value, description, accent }) {
  return (
    <div className={`stat-card ${accent ? `accent-${accent}` : ''}`}>
      <p className="stat-title">{title}</p>
      <h2>{value ?? '—'}</h2>
      <p className="stat-description">{description}</p>
    </div>
  );
}

export default StatCard;
