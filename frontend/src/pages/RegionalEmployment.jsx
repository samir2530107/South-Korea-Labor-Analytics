import { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';

import ChartCard from '../components/ChartCard';
import DataQualityNotice from '../components/DataQualityNotice';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import Select from '../components/Select';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import useFetch from '../hooks/useFetch';
import { getRegionalEmployment, getRegionalTrend } from '../services/api';
import {
  baseOptions,
  lineDataset,
  lineOptions,
  pivotByYear,
  formatNumber,
  cleanLabel,
  COLORS
} from '../utils/chartUtils';

const METRICS = {
  employment_to_population_ratio: 'Employment-to-population ratio (%)',
  labor_force_participation_rate: 'Labor force participation rate (%)',
  unemployment_rate: 'Unemployment rate (%)'
};

function RegionalEmployment() {
  const [year, setYear] = useState('');
  const [metric, setMetric] = useState('employment_to_population_ratio');

  const current = useFetch(() => getRegionalEmployment(year), [year]);
  const trend = useFetch(getRegionalTrend, []);

  if ((current.loading && !current.data) || (trend.loading && !trend.data)) {
    return <Loader text="Loading regional employment data..." />;
  }
  if (current.error) return <ErrorBox message={current.error} onRetry={current.reload} />;
  if (trend.error) return <ErrorBox message={trend.error} onRetry={trend.reload} />;

  const rows = current.data?.data || [];
  const selectedYear = current.data?.year ?? null;
  const trendRows = trend.data?.data || [];
  const allYears = [...new Set(trendRows.map(row => row.year_value))].sort((a, b) => b - a);

  const sorted = [...rows].sort((a, b) =>
    (b[metric] ?? -Infinity) - (a[metric] ?? -Infinity)
  );
  const valid = sorted.filter(row => row[metric] !== null && row[metric] !== undefined);
  const average = valid.length
    ? valid.reduce((sum, row) => sum + Number(row[metric]), 0) / valid.length
    : null;

  const barData = {
    labels: sorted.map(row => cleanLabel(row.region_name)),
    datasets: [{
      label: METRICS[metric],
      data: sorted.map(row => row[metric]),
      backgroundColor: COLORS[0],
      borderRadius: 6
    }]
  };

  const pivot = pivotByYear(trendRows, 'region_name', metric);
  const lineData = {
    labels: pivot.years,
    datasets: pivot.datasets.map((dataset, index) =>
      lineDataset(cleanLabel(dataset.group), dataset.values, COLORS[index % COLORS.length])
    )
  };

  return (
    <div className="page-content">
      <section className="welcome-section">
        <div className="welcome-copy">
          <span className="eyebrow">REGIONAL SNAPSHOT</span>
          <h2>Compare labor market conditions by city</h2>
          <p>Choose a year and indicator to compare South Korea's major cities.</p>
        </div>
      </section>

      <div className="filter-bar" aria-label="Regional data filters">
        <Select
          label="Year"
          value={year || selectedYear}
          onChange={setYear}
          options={allYears.map(value => ({ value, label: value }))}
        />
        <Select
          label="Indicator"
          value={metric}
          onChange={setMetric}
          options={Object.entries(METRICS).map(([value, label]) => ({ value, label }))}
        />
        <span className="filter-note">Total gender · seven major cities</span>
      </div>

      <DataQualityNotice dataQuality={current.data?.dataQuality} scope={`year ${selectedYear ?? '—'}`} />

      <div className="stats-grid three highlight-stats">
        <StatCard
          title="Highest value"
          value={valid[0] ? cleanLabel(valid[0].region_name) : '—'}
          description={valid[0] ? `${formatNumber(valid[0][metric], 2)}% · ${METRICS[metric]}` : 'No values for this selection'}
          accent="blue"
        />
        <StatCard
          title="Lowest value"
          value={valid.length ? cleanLabel(valid.at(-1).region_name) : '—'}
          description={valid.length ? `${formatNumber(valid.at(-1)[metric], 2)}% · ${METRICS[metric]}` : 'No values for this selection'}
          accent="orange"
        />
        <StatCard
          title="Average across cities"
          value={average !== null ? `${formatNumber(average, 2)}%` : '—'}
          description={`Unweighted city average · ${selectedYear ?? '—'}`}
          accent="green"
        />
      </div>

      <ChartCard
        title="City comparison"
        subtitle={`${METRICS[metric]} · ${selectedYear ?? 'No year selected'}`}
        empty={rows.length === 0}
        emptyText="There is no regional data for this year. Try another year or check the database connection."
      >
        <Bar
          data={barData}
          options={baseOptions({
            title: `${METRICS[metric]} (${selectedYear ?? ''})`,
            legend: false,
            yLabel: METRICS[metric],
            unit: '%'
          })}
        />
      </ChartCard>

      <ChartCard
        title="Long-term trend"
        subtitle="Each line represents one city"
        empty={trendRows.length === 0}
      >
        <Line
          data={lineData}
          options={lineOptions({
            title: `${METRICS[metric]} by year`,
            yLabel: METRICS[metric],
            unit: '%'
          })}
        />
      </ChartCard>

      <section className="chart-card">
        <div className="chart-card-header">
          <div>
            <h3>Regional data · {selectedYear ?? '—'}</h3>
            <p>Values used in the charts. Null values mean the source has no measurement.</p>
          </div>
        </div>
        <DataTable
          columns={[
            'region_name',
            'year_value',
            'population_15_plus',
            'economically_active_population',
            'employed_population',
            'unemployed_population',
            'labor_force_participation_rate',
            'employment_to_population_ratio',
            'unemployment_rate'
          ]}
          rows={sorted}
        />
      </section>
    </div>
  );
}

export default RegionalEmployment;
