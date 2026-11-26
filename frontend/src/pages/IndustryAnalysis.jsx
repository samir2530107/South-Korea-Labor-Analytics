import { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';

import ChartCard from '../components/ChartCard';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import Select from '../components/Select';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import useFetch from '../hooks/useFetch';
import { getIndustryMeta, getIndustryData, getIndustryTrend } from '../services/api';
import { baseOptions, lineDataset, lineOptions, pivotByYear, formatNumber, cleanLabel, compact, COLORS } from '../utils/chartUtils';

function IndustryAnalysis() {
  const [year, setYear] = useState('');
  const [sizeId, setSizeId] = useState('');

  const meta = useFetch(getIndustryMeta, []);
  const sizes = meta.data?.sizes || [];
  const years = meta.data?.years || [];
  const activeSizeId = sizeId || (sizes[0] ? String(sizes[0].size_id) : '');

  const current = useFetch(
    () => (meta.data ? getIndustryData(year, activeSizeId) : Promise.resolve({ success: true, year: null, data: [] })),
    [year, activeSizeId, Boolean(meta.data)]
  );
  const trend = useFetch(
    () => (meta.data ? getIndustryTrend(activeSizeId) : Promise.resolve({ success: true, data: [] })),
    [activeSizeId, Boolean(meta.data)]
  );

  if ((meta.loading && !meta.data) || (current.loading && !current.data)) {
    return <Loader text="Loading industry data..." />;
  }
  if (meta.error) return <ErrorBox message={meta.error} onRetry={meta.reload} />;
  if (current.error) return <ErrorBox message={current.error} onRetry={current.reload} />;
  if (trend.error) return <ErrorBox message={trend.error} onRetry={trend.reload} />;

  const data = current.data?.data || [];
  const selectedYear = current.data?.year ?? null;
  const trendRows = trend.data?.data || [];
  const sizeLabel = sizes.find(s => String(s.size_id) === activeSizeId)?.size_category ?? '';

  const withWages = data.filter(d => d.total_wages !== null);
  const topWage = [...withWages].sort((a, b) => b.total_wages - a.total_wages)[0];
  const withHours = data.filter(d => d.total_hours_worked !== null);
  const topHours = [...withHours].sort((a, b) => b.total_hours_worked - a.total_hours_worked)[0];
  const regTotal = data.reduce((s, d) => s + (d.regular_hours_worked ?? 0), 0);
  const otTotal = data.reduce((s, d) => s + (d.overtime_hours_worked ?? 0), 0);
  const overtimeShare = regTotal + otTotal > 0 ? (otTotal / (regTotal + otTotal)) * 100 : null;

  const industries = data.map(d => cleanLabel(d.industry_name));
  const barHeight = Math.max(400, industries.length * 30 + 120);

  const wageData = {
    labels: industries,
    datasets: [{ label: 'Total Wages', data: data.map(d => d.total_wages), backgroundColor: COLORS[0], borderRadius: 4 }]
  };

  const hoursData = {
    labels: industries,
    datasets: [
      { label: 'Regular Hours', data: data.map(d => d.regular_hours_worked), backgroundColor: COLORS[2], borderRadius: 3 },
      { label: 'Overtime Hours', data: data.map(d => d.overtime_hours_worked), backgroundColor: COLORS[3], borderRadius: 3 }
    ]
  };

  const daysData = {
    labels: industries,
    datasets: [{ label: 'Total Days Worked', data: data.map(d => d.total_days_worked), backgroundColor: COLORS[4], borderRadius: 4 }]
  };

  const topNames = [...withWages].sort((a, b) => b.total_wages - a.total_wages).slice(0, 6).map(d => d.industry_name);
  const pivot = pivotByYear(trendRows.filter(r => topNames.includes(r.industry_name)), 'industry_name', 'total_wages');
  const trendData = {
    labels: pivot.years,
    datasets: pivot.datasets.map((d, i) => lineDataset(cleanLabel(d.group), d.values, COLORS[i % COLORS.length]))
  };

  const wageOptions = baseOptions({ title: `Wages by Industry (${selectedYear ?? ''} \u00b7 ${sizeLabel})`, legend: false, horizontal: true, yLabel: 'Total Wages' });
  wageOptions.scales.x.ticks = { callback: v => compact(v) };
  const hoursOptions = baseOptions({ title: `Regular vs Overtime Hours (${selectedYear ?? ''} \u00b7 ${sizeLabel})`, horizontal: true, stacked: true, yLabel: 'Hours Worked' });
  hoursOptions.scales.x.ticks = { callback: v => compact(v) };
  const daysOptions = baseOptions({ legend: false, horizontal: true, yLabel: 'Days Worked' });
  daysOptions.scales.x.ticks = { callback: v => compact(v) };
  const trendOptions = lineOptions({ title: 'Wage Trend \u00b7 Top 6 Industries', yLabel: 'Total Wages' });
  trendOptions.scales.y.ticks = { callback: v => compact(v) };

  return (
    <div className="page-content">
      <div className="welcome-section">
        <h2>Industry Analysis</h2>
        <p>Explore wage levels and working hours across South Korea&apos;s industries and establishment sizes.</p>
      </div>

      <div className="filter-bar">
        <Select
          label="Year"
          value={year || selectedYear}
          onChange={setYear}
          options={years.map(y => ({ value: y, label: y }))}
        />
        <Select
          label="Establishment Size"
          value={activeSizeId}
          onChange={setSizeId}
          options={sizes.map(s => ({ value: s.size_id, label: s.size_category }))}
        />
        <span className="filter-note">Industries: {industries.length}</span>
      </div>

      <div className="stats-grid three">
        <StatCard title="Highest Wages" value={topWage ? cleanLabel(topWage.industry_name) : '\u2014'} description={topWage ? formatNumber(topWage.total_wages, 0) : ''} />
        <StatCard title="Most Hours Worked" value={topHours ? cleanLabel(topHours.industry_name) : '\u2014'} description={topHours ? formatNumber(topHours.total_hours_worked, 1) : ''} />
        <StatCard title="Overtime Share of Hours" value={overtimeShare !== null ? `${formatNumber(overtimeShare, 1)}%` : '\u2014'} description={`${sizeLabel} \u00b7 ${selectedYear ?? '\u2014'}`} />
      </div>

      <ChartCard title="Wages by Industry" subtitle="Selected year and establishment size" height={barHeight} empty={withWages.length === 0} emptyText="No wage data for this year and size.">
        <Bar data={wageData} options={wageOptions} />
      </ChartCard>

      <ChartCard title="Working Hours by Industry" subtitle="Regular and overtime hours" height={barHeight} empty={data.every(d => d.regular_hours_worked === null && d.overtime_hours_worked === null)} emptyText="No hours data for this year and size.">
        <Bar data={hoursData} options={hoursOptions} />
      </ChartCard>

      <ChartCard title="Days Worked by Industry" subtitle="Total days worked" height={barHeight} empty={data.every(d => d.total_days_worked === null)} emptyText="No days-worked data for this year and size.">
        <Bar data={daysData} options={daysOptions} />
      </ChartCard>

      <ChartCard title="Wage Trend" subtitle="Six highest-paying industries across years" empty={trendRows.length === 0 || topNames.length === 0}>
        <Line data={trendData} options={trendOptions} />
      </ChartCard>

      <section className="chart-card">
        <div className="chart-card-header">
          <div>
            <h3>Data for {selectedYear ?? '\u2014'} \u00b7 {sizeLabel}</h3>
            <p>Rows used in the charts above</p>
          </div>
        </div>
        <DataTable
          columns={['industry_name', 'size_category', 'year_value', 'total_wages', 'total_hours_worked', 'regular_hours_worked', 'overtime_hours_worked', 'total_days_worked']}
          rows={data}
        />
      </section>
    </div>
  );
}

export default IndustryAnalysis;
