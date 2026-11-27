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

const QUICK_VIEWS = [
  { id: 'wages', label: 'Wage focus', icon: '₩', hint: 'Monthly pay per worker' },
  { id: 'hours', label: 'Working hours', icon: '◷', hint: 'Regular + overtime hours' },
  { id: 'days', label: 'Working days', icon: '▦', hint: 'Average days per month' }
];

const QUICK_VIEW_DETAILS = {
  wages: {
    eyebrow: 'WAGE FOCUS · 임금총액',
    title: 'Total Wages (Won)',
    unit: 'Average gross pay per worker, per month',
    description: 'Total Wages = Regular Payments + Overtime Payments + Special Payments / Bonuses.',
    example: '₩6,733,071 per month',
    exampleLabel: 'Total Wages example'
  },
  hours: {
    eyebrow: 'WORKING HOURS · 총근로시간',
    title: 'Total Hours Worked (Hour)',
    unit: 'Average hours per worker, per month',
    description: 'Total Hours Worked = Regular Hours (소정실근로시간) + Overtime Hours (초과근로시간).',
    example: '163.7 hours per month',
    exampleLabel: 'Total Hours Worked example'
  },
  days: {
    eyebrow: 'WORKING DAYS · 총근로일수',
    title: 'Total Days Worked (Day)',
    unit: 'Average working days per worker, per month',
    description: 'This is the average monthly number of days worked by one worker.',
    example: '19.3 days per month',
    exampleLabel: 'Total Days Worked example'
  }
};

function averageOf(rows, key) {
  const values = rows
    .map(row => Number(row[key]))
    .filter(value => Number.isFinite(value));
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function formatWon(value) {
  return value === null || value === undefined || !Number.isFinite(Number(value))
    ? '—'
    : `₩${formatNumber(value, 0)}`;
}

function IndustryAnalysis() {
  const [year, setYear] = useState('');
  const [sizeId, setSizeId] = useState('');
  const [quickView, setQuickView] = useState('wages');

  const meta = useFetch(getIndustryMeta, []);
  const sizes = meta.data?.sizes || [];
  const years = meta.data?.years || [];
  const activeSizeId = sizeId || (sizes[0] ? String(sizes[0].size_id) : '');

  const current = useFetch(
    () => (meta.data
      ? getIndustryData(year, activeSizeId)
      : Promise.resolve({ success: true, year: null, data: [] })),
    [year, activeSizeId, Boolean(meta.data)]
  );
  const trend = useFetch(
    () => (meta.data
      ? getIndustryTrend(activeSizeId)
      : Promise.resolve({ success: true, data: [] })),
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
  const sizeLabel = sizes.find(size => String(size.size_id) === activeSizeId)?.size_category ?? '';

  const withWages = data.filter(row => row.total_wages !== null && row.total_wages !== undefined);
  const withHours = data.filter(row => row.total_hours_worked !== null && row.total_hours_worked !== undefined);
  const withDays = data.filter(row => row.total_days_worked !== null && row.total_days_worked !== undefined);
  const topWage = [...withWages].sort((a, b) => b.total_wages - a.total_wages)[0];
  const topHours = [...withHours].sort((a, b) => b.total_hours_worked - a.total_hours_worked)[0];
  const topDays = [...withDays].sort((a, b) => b.total_days_worked - a.total_days_worked)[0];
  const averageWage = averageOf(withWages, 'total_wages');
  const averageHours = averageOf(withHours, 'total_hours_worked');
  const averageDays = averageOf(withDays, 'total_days_worked');

  const regularTotal = data.reduce((sum, row) => sum + (Number(row.regular_hours_worked) || 0), 0);
  const overtimeTotal = data.reduce((sum, row) => sum + (Number(row.overtime_hours_worked) || 0), 0);
  const overtimeShare = regularTotal + overtimeTotal > 0
    ? (overtimeTotal / (regularTotal + overtimeTotal)) * 100
    : null;

  const industries = data.map(row => cleanLabel(row.industry_name));
  const barHeight = Math.max(400, industries.length * 30 + 120);
  const wageData = {
    labels: industries,
    datasets: [{
      label: 'Total wages per worker / month',
      data: data.map(row => row.total_wages),
      backgroundColor: COLORS[0],
      borderRadius: 4
    }]
  };
  const totalHoursData = {
    labels: industries,
    datasets: [{
      label: 'Total hours worked per worker / month',
      data: data.map(row => row.total_hours_worked),
      backgroundColor: COLORS[2],
      borderRadius: 4
    }]
  };
  const hoursBreakdownData = {
    labels: industries,
    datasets: [
      { label: 'Regular hours', data: data.map(row => row.regular_hours_worked), backgroundColor: COLORS[2], borderRadius: 3 },
      { label: 'Overtime hours', data: data.map(row => row.overtime_hours_worked), backgroundColor: COLORS[3], borderRadius: 3 }
    ]
  };
  const daysData = {
    labels: industries,
    datasets: [{
      label: 'Total days worked per worker / month',
      data: data.map(row => row.total_days_worked),
      backgroundColor: COLORS[4],
      borderRadius: 4
    }]
  };

  const topNames = [...withWages]
    .sort((a, b) => b.total_wages - a.total_wages)
    .slice(0, 6)
    .map(row => row.industry_name);
  const pivot = pivotByYear(
    trendRows.filter(row => topNames.includes(row.industry_name)),
    'industry_name',
    'total_wages'
  );
  const trendData = {
    labels: pivot.years,
    datasets: pivot.datasets.map((dataset, index) =>
      lineDataset(cleanLabel(dataset.group), dataset.values, COLORS[index % COLORS.length])
    )
  };

  const wageOptions = baseOptions({
    title: `Average monthly wages by industry (${selectedYear ?? ''} · ${sizeLabel})`,
    legend: false,
    horizontal: true,
    yLabel: 'Monthly gross pay (Won)'
  });
  wageOptions.scales.x.ticks = { callback: value => compact(value) };
  wageOptions.plugins.tooltip.callbacks.label = context =>
    `${cleanLabel(context.label)}: ${formatWon(context.parsed.x)} / month`;

  const totalHoursOptions = baseOptions({
    title: `Average monthly hours by industry (${selectedYear ?? ''} · ${sizeLabel})`,
    legend: false,
    horizontal: true,
    yLabel: 'Hours per worker / month',
    unit: ' hours'
  });
  totalHoursOptions.scales.x.ticks = { callback: value => compact(value) };

  const hoursBreakdownOptions = baseOptions({
    title: `Regular vs overtime hours (${selectedYear ?? ''} · ${sizeLabel})`,
    horizontal: true,
    stacked: true,
    yLabel: 'Hours per worker / month',
    unit: ' hours'
  });
  hoursBreakdownOptions.scales.x.ticks = { callback: value => compact(value) };

  const daysOptions = baseOptions({
    title: `Average monthly working days (${selectedYear ?? ''} · ${sizeLabel})`,
    legend: false,
    horizontal: true,
    yLabel: 'Days per worker / month',
    unit: ' days'
  });
  daysOptions.scales.x.ticks = { callback: value => compact(value) };

  const trendOptions = lineOptions({ title: 'Monthly wage trend · top six industries', yLabel: 'Wages (Won)' });
  trendOptions.scales.y.ticks = { callback: value => compact(value) };
  trendOptions.plugins.tooltip.callbacks.label = context =>
    `${context.dataset.label}: ${formatWon(context.parsed.y)} / month`;

  const details = QUICK_VIEW_DETAILS[quickView];

  return (
    <div className="page-content">
      <section className="welcome-section">
        <div className="welcome-copy">
          <span className="eyebrow">INDUSTRY INSIGHTS</span>
          <h2>Wages and working time by industry</h2>
          <p>Compare monthly pay, hours and days across industries and establishment sizes.</p>
        </div>
      </section>

      <div className="filter-bar" aria-label="Industry filters">
        <Select
          label="Year"
          value={year || selectedYear}
          onChange={setYear}
          options={years.map(value => ({ value, label: value }))}
        />
        <Select
          label="Establishment size"
          value={activeSizeId}
          onChange={setSizeId}
          options={sizes.map(size => ({ value: size.size_id, label: cleanLabel(size.size_category) }))}
        />
        <span className="filter-note">{industries.length} industries</span>
      </div>

      <section className="quick-view" aria-label="Industry labor statistics quick view">
        <div className="quick-view-heading">
          <div>
            <span className="eyebrow">QUICK VIEW</span>
            <h3>Choose a focus</h3>
          </div>
          <span className="quick-view-context">{selectedYear ?? 'Latest year'} · {cleanLabel(sizeLabel) || 'All sizes'}</span>
        </div>
        <div className="quick-view-options" role="tablist" aria-label="Industry metric focus">
          {QUICK_VIEWS.map(view => (
            <button
              key={view.id}
              id={`quick-view-tab-${view.id}`}
              type="button"
              role="tab"
              aria-selected={quickView === view.id}
              aria-controls="industry-quick-view-panel"
              className={`quick-view-option ${quickView === view.id ? 'active' : ''}`}
              onClick={() => setQuickView(view.id)}
            >
              <span className="quick-view-icon" aria-hidden="true">{view.icon}</span>
              <span className="quick-view-label">
                <strong>{view.label}</strong>
                <small>{view.hint}</small>
              </span>
              <span className="quick-view-arrow" aria-hidden="true">→</span>
            </button>
          ))}
        </div>
        <div
          className={`quick-view-panel quick-view-${quickView}`}
          id="industry-quick-view-panel"
          role="tabpanel"
          aria-labelledby={`quick-view-tab-${quickView}`}
        >
          <div className="quick-view-definition">
            <span className="eyebrow">{details.eyebrow}</span>
            <h3>{details.title}</h3>
            <span className="metric-unit">{details.unit}</span>
            <p>{details.description}</p>
            <div className="example-value">
              <span>{details.exampleLabel}</span>
              <strong>{details.example}</strong>
              <small>Reference example only — not a result for the selected filters.</small>
            </div>
          </div>
          {quickView === 'wages' && (
            <aside className="permanent-wage-note">
              <span className="eyebrow">PERMANENT EMPLOYEES · 상용근로자 임금총액</span>
              <h4>Total Wages: Permanent Employees</h4>
              <p>
                The same monthly gross-pay average, filtered strictly to regular / permanent
                workers and excluding temporary and daily workers. As in the example below,
                this group average can be slightly higher than the overall average because
                temporary and daily workers are excluded.
              </p>
              <div className="example-value permanent-example">
                <span>Reference example supplied</span>
                <strong>₩6,824,385 / month</strong>
                <small>Compared with ₩6,733,071 overall; examples only.</small>
              </div>
              <p className="availability-note">
                The current API exposes overall <code>total_wages</code> only. A separate
                permanent-worker wage field is not available to chart from this dataset yet.
              </p>
            </aside>
          )}
        </div>
      </section>

      {quickView === 'wages' && (
        <>
          <div className="stats-grid three highlight-stats">
            <StatCard
              title="Highest average wages"
              value={topWage ? cleanLabel(topWage.industry_name) : '—'}
              description={topWage ? `${formatWon(topWage.total_wages)} per worker / month` : 'No wage data'}
              accent="blue"
            />
            <StatCard
              title="Average across industries"
              value={formatWon(averageWage)}
              description="Unweighted average of available industry values"
              accent="green"
            />
            <StatCard
              title="Permanent-worker wages"
              value="Not in source"
              description="Requires a separate permanent-worker field"
              accent="orange"
            />
          </div>
          <ChartCard
            title="Monthly wages by industry"
            subtitle="Average gross pay per worker · Won per month"
            height={barHeight}
            empty={withWages.length === 0}
            emptyText="No wage data for this year and establishment size."
          >
            <Bar data={wageData} options={wageOptions} />
          </ChartCard>
          <ChartCard
            title="Monthly wage trend"
            subtitle="Up to six highest-paying industries in the selected year"
            empty={trendRows.length === 0 || topNames.length === 0}
          >
            <Line data={trendData} options={trendOptions} />
          </ChartCard>
        </>
      )}

      {quickView === 'hours' && (
        <>
          <div className="stats-grid three highlight-stats">
            <StatCard
              title="Most hours worked"
              value={topHours ? cleanLabel(topHours.industry_name) : '—'}
              description={topHours ? `${formatNumber(topHours.total_hours_worked, 1)} hours / month` : 'No hours data'}
              accent="blue"
            />
            <StatCard
              title="Average monthly hours"
              value={averageHours !== null ? formatNumber(averageHours, 1) : '—'}
              description="Unweighted average per industry"
              accent="green"
            />
            <StatCard
              title="Overtime share"
              value={overtimeShare !== null ? `${formatNumber(overtimeShare, 1)}%` : '—'}
              description="Overtime hours ÷ regular + overtime hours"
              accent="orange"
            />
          </div>
          <ChartCard
            title="Total monthly hours by industry"
            subtitle="Regular hours plus overtime hours · per worker"
            height={barHeight}
            empty={withHours.length === 0}
            emptyText="No working-hours data for this year and establishment size."
          >
            <Bar data={totalHoursData} options={totalHoursOptions} />
          </ChartCard>
          <ChartCard
            title="Regular and overtime breakdown"
            subtitle="The stacked components add up to total hours worked"
            height={barHeight}
            empty={data.every(row => row.regular_hours_worked === null && row.overtime_hours_worked === null)}
            emptyText="No regular/overtime breakdown is available for this selection."
          >
            <Bar data={hoursBreakdownData} options={hoursBreakdownOptions} />
          </ChartCard>
        </>
      )}

      {quickView === 'days' && (
        <>
          <div className="stats-grid three highlight-stats">
            <StatCard
              title="Most working days"
              value={topDays ? cleanLabel(topDays.industry_name) : '—'}
              description={topDays ? `${formatNumber(topDays.total_days_worked, 1)} days / month` : 'No days-worked data'}
              accent="blue"
            />
            <StatCard
              title="Average monthly working days"
              value={averageDays !== null ? formatNumber(averageDays, 1) : '—'}
              description="Unweighted average per industry"
              accent="green"
            />
            <StatCard
              title="Industries with data"
              value={withDays.length.toLocaleString()}
              description="For the selected year and size"
              accent="purple"
            />
          </div>
          <ChartCard
            title="Average monthly working days by industry"
            subtitle="Days worked per worker · days per month"
            height={barHeight}
            empty={withDays.length === 0}
            emptyText="No days-worked data for this year and establishment size."
          >
            <Bar data={daysData} options={daysOptions} />
          </ChartCard>
        </>
      )}

      <section className="chart-card">
        <div className="chart-card-header">
          <div>
            <h3>Industry data · {selectedYear ?? '—'} · {cleanLabel(sizeLabel)}</h3>
            <p>Values used in the charts. Null values mean the source has no measurement.</p>
          </div>
        </div>
        <DataTable
          columns={[
            'industry_name',
            'size_category',
            'year_value',
            'total_wages',
            'total_hours_worked',
            'regular_hours_worked',
            'overtime_hours_worked',
            'total_days_worked'
          ]}
          rows={data}
        />
      </section>
    </div>
  );
}

export default IndustryAnalysis;
