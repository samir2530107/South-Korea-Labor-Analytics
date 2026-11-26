import { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';

import ChartCard from '../components/ChartCard';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import Select from '../components/Select';
import StatCard from '../components/StatCard';
import useFetch from '../hooks/useFetch';
import { getUnemploymentData, getRegionalTrend } from '../services/api';
import { baseOptions, lineDataset, lineOptions, pivotByYear, formatNumber, cleanLabel, compact, COLORS } from '../utils/chartUtils';

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

  const valid = [...data].filter(d => d.unemployment_rate !== null).sort((a, b) => b.unemployment_rate - a.unemployment_rate);
  const average = valid.length ? valid.reduce((s, d) => s + d.unemployment_rate, 0) / valid.length : null;

  const barData = {
    labels: data.map(d => cleanLabel(d.region_name)),
    datasets: [{ label: 'Unemployment Rate (%)', data: data.map(d => d.unemployment_rate), backgroundColor: COLORS[1], borderRadius: 6 }]
  };

  const withPopulation = data.filter(d => d.economically_active_population !== null);
  const populationData = {
    labels: withPopulation.map(d => cleanLabel(d.region_name)),
    datasets: [{
      label: 'Economically Active Population (Thousand Person)',
      data: withPopulation.map(d => d.economically_active_population),
      backgroundColor: COLORS[2],
      borderRadius: 6
    }]
  };

  const pivot = pivotByYear(trendRows, 'region_name', 'unemployment_rate');
  const lineData = {
    labels: pivot.years,
    datasets: pivot.datasets.map((d, i) => lineDataset(cleanLabel(d.group), d.values, COLORS[i % COLORS.length]))
  };

  const populationOptions = baseOptions({ legend: false, yLabel: 'Economically Active Population (Thousand Person)' });
  populationOptions.plugins.tooltip.callbacks.label = ctx => `${formatNumber(ctx.parsed.y, 0)} thousand persons`;
  populationOptions.scales.y.ticks = { callback: v => compact(v) };

  return (
    <div className="page-content">
      <div className="welcome-section">
        <h2>Unemployment Analysis</h2>
        <p>Examine unemployment rates across South Korea&apos;s seven major cities.</p>
      </div>

      <div className="filter-bar">
        <Select
          label="Year"
          value={year || selectedYear}
          onChange={setYear}
          options={years.map(y => ({ value: y, label: y }))}
        />
        <span className="filter-note">Gender: Total</span>
      </div>

      <div className="stats-grid three">
        <StatCard title="Highest Unemployment" value={valid[0] ? cleanLabel(valid[0].region_name) : '\u2014'} description={valid[0] ? `${formatNumber(valid[0].unemployment_rate, 2)}%` : ''} />
        <StatCard title="Lowest Unemployment" value={valid.at(-1) ? cleanLabel(valid.at(-1).region_name) : '\u2014'} description={valid.length ? `${formatNumber(valid.at(-1).unemployment_rate, 2)}%` : ''} />
        <StatCard title="Average of Cities" value={average !== null ? `${formatNumber(average, 2)}%` : '\u2014'} description={`Year ${selectedYear ?? '\u2014'}`} />
      </div>

      <ChartCard title="Regional Unemployment Comparison" subtitle="Unemployment rate by major city" empty={data.length === 0}>
        <Bar data={barData} options={baseOptions({ title: `Regional Unemployment Rate (${selectedYear ?? ''})`, legend: false, yLabel: 'Unemployment Rate (%)', unit: '%' })} />
      </ChartCard>

      <ChartCard title="Unemployment Trend" subtitle="All seven cities over time" empty={trendRows.length === 0}>
        <Line data={lineData} options={lineOptions({ title: 'Unemployment rate by year', yLabel: 'Unemployment Rate (%)', unit: '%' })} />
      </ChartCard>

      <ChartCard title="Economically Active Population" subtitle={`By city \u00b7 ${selectedYear ?? '\u2014'} \u00b7 (Thousand Person)`} height={340} empty={withPopulation.length === 0}>
        <Bar data={populationData} options={populationOptions} />
      </ChartCard>
    </div>
  );
}

export default Unemployment;
