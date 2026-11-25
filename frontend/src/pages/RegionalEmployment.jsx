import { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';

import ChartCard from '../components/ChartCard';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import Select from '../components/Select';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import useFetch from '../hooks/useFetch';
import { getRegionalEmployment, getRegionalTrend } from '../services/api';
import { baseOptions, lineDataset, lineOptions, pivotByYear, formatNumber, COLORS } from '../utils/chartUtils';

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
  const allYears = [...new Set(trendRows.map(r => r.year_value))].sort((a, b) => b - a);

  const sorted = [...rows].sort((a, b) => (b[metric] ?? -Infinity) - (a[metric] ?? -Infinity));
  const valid = sorted.filter(r => r[metric] !== null);
  const average = valid.length ? valid.reduce((s, r) => s + r[metric], 0) / valid.length : null;

  const barData = {
    labels: sorted.map(r => r.region_name),
    datasets: [
      {
        label: METRICS[metric],
        data: sorted.map(r => r[metric]),
        backgroundColor: COLORS[0],
        borderRadius: 6
      }
    ]
  };

  const pivot = pivotByYear(trendRows, 'region_name', metric);
  const lineData = {
    labels: pivot.years,
    datasets: pivot.datasets.map((d, i) => lineDataset(d.group, d.values, COLORS[i % COLORS.length]))
  };

  return (
    <div className="page-content">
      <div className="welcome-section">
        <h2>Regional Employment Analysis</h2>
        <p>Compare labor market indicators across South Korea's seven major cities.</p>
      </div>

      <div className="filter-bar">
        <Select
          label="Year"
          value={year || selectedYear}
          onChange={setYear}
          options={allYears.map(y => ({ value: y, label: y }))}
        />
        <Select
          label="Indicator"
          value={metric}
          onChange={setMetric}
          options={Object.entries(METRICS).map(([value, label]) => ({ value, label }))}
        />
        <span className="filter-note">Gender: Total</span>
      </div>

      <div className="stats-grid three">
        <StatCard title="Highest" value={valid[0]?.region_name ?? '—'} description={valid[0] ? `${formatNumber(valid[0][metric], 2)}%` : ''} />
        <StatCard title="Lowest" value={valid.at(-1)?.region_name ?? '—'} description={valid.length ? `${formatNumber(valid.at(-1)[metric], 2)}%` : ''} />
        <StatCard title="Average of cities" value={average !== null ? `${formatNumber(average, 2)}%` : '—'} description={`Year ${selectedYear ?? '—'}`} />
      </div>

      <ChartCard
        title="Comparison by City"
        subtitle={`${METRICS[metric]} · ${selectedYear ?? '—'}`}
        empty={rows.length === 0}
      >
        <Bar data={barData} options={baseOptions({ title: `${METRICS[metric]} (${selectedYear ?? ''})`, legend: false, yLabel: METRICS[metric], unit: '%' })} />
      </ChartCard>

      <ChartCard
        title="Trend Over Time"
        subtitle="All seven cities, all available years"
        empty={trendRows.length === 0}
      >
        <Line data={lineData} options={lineOptions({ title: `${METRICS[metric]} by year`, yLabel: METRICS[metric], unit: '%' })} />
      </ChartCard>

      <section className="chart-card">
        <div className="chart-card-header">
          <div>
            <h3>Data for {selectedYear ?? '—'}</h3>
            <p>Rows used in the charts above</p>
          </div>
        </div>
        <DataTable
          columns={['region_name', 'year_value', 'employment_to_population_ratio', 'labor_force_participation_rate', 'unemployment_rate']}
          rows={sorted}
        />
      </section>
    </div>
  );
}

export default RegionalEmployment;
