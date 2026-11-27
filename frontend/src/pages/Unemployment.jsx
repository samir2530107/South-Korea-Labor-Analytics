import { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';

import ChartCard from '../components/ChartCard';
import DataQualityNotice from '../components/DataQualityNotice';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import Select from '../components/Select';
import StatCard from '../components/StatCard';
import useFetch from '../hooks/useFetch';
import { getUnemploymentData, getRegionalTrend } from '../services/api';
import {
  baseOptions,
  lineDataset,
  lineOptions,
  pivotByYear,
  formatNumber,
  cleanLabel,
  compact,
  COLORS
} from '../utils/chartUtils';

function Unemployment() {
  const [year, setYear] = useState('');

  const current = useFetch(() => getUnemploymentData(year), [year]);
  const trend = useFetch(getRegionalTrend, []);

  if ((current.loading && !current.data) || (trend.loading && !trend.data)) {
    return <Loader text="Loading unemployment data..." />;
  }
  if (current.error) return <ErrorBox message={current.error} onRetry={current.reload} />;
  if (trend.error) return <ErrorBox message={trend.error} onRetry={trend.reload} />;

  const data = current.data?.data || [];
  const selectedYear = current.data?.year ?? null;
  const years = current.data?.years || [];
  const trendRows = trend.data?.data || [];
  const valid = data.filter(row => row.unemployment_rate !== null && row.unemployment_rate !== undefined);
  const average = valid.length
    ? valid.reduce((sum, row) => sum + Number(row.unemployment_rate), 0) / valid.length
    : null;

  const barData = {
    labels: data.map(row => cleanLabel(row.region_name)),
    datasets: [{
      label: 'Unemployment rate',
      data: data.map(row => row.unemployment_rate),
      backgroundColor: COLORS[1],
      borderRadius: 6
    }]
  };

  const withPopulation = data.filter(row => row.economically_active_population !== null);
  const populationData = {
    labels: withPopulation.map(row => cleanLabel(row.region_name)),
    datasets: [{
      label: 'Economically active population',
      data: withPopulation.map(row => row.economically_active_population),
      backgroundColor: COLORS[2],
      borderRadius: 6
    }]
  };

  const pivot = pivotByYear(trendRows, 'region_name', 'unemployment_rate');
  const lineData = {
    labels: pivot.years,
    datasets: pivot.datasets.map((dataset, index) =>
      lineDataset(cleanLabel(dataset.group), dataset.values, COLORS[index % COLORS.length])
    )
  };

  const populationOptions = baseOptions({
    legend: false,
    yLabel: 'Economically active population (thousand persons)'
  });
  populationOptions.plugins.tooltip.callbacks.label = context =>
    `${formatNumber(context.parsed.y, 1)} thousand persons`;
  populationOptions.scales.y.ticks = { callback: value => compact(value) };

  return (
    <div className="page-content">
      <section className="welcome-section">
        <div className="welcome-copy">
          <span className="eyebrow">UNEMPLOYMENT</span>
          <h2>Where is unemployment changing?</h2>
          <p>Compare unemployment rates and labor-force size across the major cities.</p>
        </div>
      </section>

      <div className="filter-bar" aria-label="Unemployment filters">
        <Select
          label="Year"
          value={year || selectedYear}
          onChange={setYear}
          options={years.map(value => ({ value, label: value }))}
        />
        <span className="filter-note">Total gender · rates shown as percentages</span>
      </div>

      <DataQualityNotice dataQuality={current.data?.dataQuality} scope={`year ${selectedYear ?? '—'}`} />

      <div className="stats-grid three highlight-stats">
        <StatCard
          title="Highest unemployment"
          value={valid[0] ? cleanLabel(valid[0].region_name) : '—'}
          description={valid[0] ? `${formatNumber(valid[0].unemployment_rate, 2)}%` : 'No values for this selection'}
          accent="orange"
        />
        <StatCard
          title="Lowest unemployment"
          value={valid.length ? cleanLabel(valid.at(-1).region_name) : '—'}
          description={valid.length ? `${formatNumber(valid.at(-1).unemployment_rate, 2)}%` : 'No values for this selection'}
          accent="green"
        />
        <StatCard
          title="Average across cities"
          value={average !== null ? `${formatNumber(average, 2)}%` : '—'}
          description={`Unweighted city average · ${selectedYear ?? '—'}`}
          accent="blue"
        />
      </div>

      <ChartCard
        title="Unemployment by city"
        subtitle={`Total gender · ${selectedYear ?? 'No year selected'}`}
        empty={data.length === 0}
        emptyText="There is no unemployment data for this year. Try another year or check the database connection."
      >
        <Bar
          data={barData}
          options={baseOptions({
            title: `Unemployment rate (${selectedYear ?? ''})`,
            legend: false,
            yLabel: 'Unemployment rate (%)',
            unit: '%'
          })}
        />
      </ChartCard>

      <ChartCard
        title="Unemployment trend"
        subtitle="Each line represents one city"
        empty={trendRows.length === 0}
      >
        <Line
          data={lineData}
          options={lineOptions({
            title: 'Unemployment rate by year',
            yLabel: 'Unemployment rate (%)',
            unit: '%'
          })}
        />
      </ChartCard>

      <ChartCard
        title="Economically active population"
        subtitle={`By city · ${selectedYear ?? 'No year selected'} · thousand persons`}
        height={340}
        empty={withPopulation.length === 0}
      >
        <Bar data={populationData} options={populationOptions} />
      </ChartCard>
    </div>
  );
}

export default Unemployment;
