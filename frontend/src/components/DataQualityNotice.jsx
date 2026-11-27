import { formatNumber } from '../utils/chartUtils';

function displayValue(value, unit) {
  if (value === null || value === undefined) return 'missing';
  const formatted = formatNumber(value, 2);
  return unit ? `${formatted} ${unit}` : formatted;
}

function DataQualityNotice({ dataQuality, scope = 'this selection' }) {
  if (!dataQuality) return null;

  const issues = dataQuality.issues || [];
  const corrections = Number(dataQuality.correctionCount) || 0;
  const wasReconciled = corrections > 0;

  return (
    <section
      className={`quality-notice ${wasReconciled ? 'has-corrections' : 'is-verified'}`}
      aria-live="polite"
    >
      <div className="quality-heading">
        <span className="quality-icon" aria-hidden="true">{wasReconciled ? '!' : '✓'}</span>
        <div>
          <h3>Data quality check</h3>
          <p>
            {wasReconciled
              ? `${corrections} Total value${corrections === 1 ? '' : 's'} reconciled for ${scope}.`
              : `Checked ${Number(dataQuality.checkedRegions) || 0} region-year total${Number(dataQuality.checkedRegions) === 1 ? '' : 's'} for ${scope}; no material mismatch found.`}
          </p>
        </div>
      </div>

      {wasReconciled && (
        <>
          <p className="quality-explanation">
            The analytics view validates population counts against Male + Female records and
            recalculates rates when needed. The read-only source database is not changed.
          </p>
          {issues.length > 0 && (
            <ul className="quality-issues">
              {issues.map((issue, index) => (
                <li key={`${issue.region_name}-${issue.year_value}-${issue.metric}-${index}`}>
                  <strong>{issue.region_name} · {issue.year_value}</strong>
                  <span>
                    {issue.metricLabel}: {displayValue(issue.sourceValue, issue.unit)}
                    {' → '}
                    {displayValue(issue.validatedValue, issue.unit)}
                  </span>
                  <small>Checked using {issue.method}</small>
                </li>
              ))}
            </ul>
          )}
          {dataQuality.omittedIssueCount > 0 && (
            <p className="quality-more">
              Plus {dataQuality.omittedIssueCount.toLocaleString()} additional adjustment{dataQuality.omittedIssueCount === 1 ? '' : 's'}.
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default DataQualityNotice;
