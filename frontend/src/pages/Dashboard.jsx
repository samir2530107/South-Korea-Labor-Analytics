import { Link } from 'react-router-dom';
import { Bar, Line } from 'react-chartjs-2';

import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import DataQualityNotice from '../components/DataQualityNotice';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import useFetch from '../hooks/useFetch';
import { getDashboardSummary } from '../services/api';
import {
  baseOptions,
  lineDataset,
  lineOptions,
  formatNumber,
  cleanLabel,
  COLORS
} from '../utils/chartUtils';

function recordCount(value) {
  const count = Number(value);
  return Number.isFinite(count) ? count.toLocaleString() : '—';
}

function Dashboard() {
  const { data: summary, loading, error, reload } = useFetch(getDashboardSummary, []);

  if (loading && !summary) return <Loader text="Loading labor market overview..." />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!summary) return null;

  const regions = summary.regions || [];
  const trend = summary.trend || [];
  const latestYear = summary.latestYear ?? '—';

  const topEmployment = [...regions]
    .filter(row => row.employment_to_population_ratio !== null)
    .sort((a, b) => b.employment_to_population_ratio - a.employment_to_population_ratio)[0];
  const topUnemployment = [...regions]
    .filter(row => row.unemployment_rate !== null)
    .sort((a, b) => b.unemployment_rate - a.unemployment_rate)[0];
  const lowUnemployment = [...regions]
    .filter(row => row.unemployment_rate !== null)
    .sort((a, b) => a.unemployment_rate - b.unemployment_rate)[0];

  const trendData = {
    labels: trend.map(row => row.year_value),
    datasets: [
      lineDataset('Average employment-to-population ratio', trend.map(row => row.avg_employment), COLORS[0]),
      lineDataset('Average unemployment rate', trend.map(row => row.avg_unemployment), COLORS[1])
    ]
  };

  const regionData = {
    labels: regions.map(row => cleanLabel(row.region_name)),
    datasets: [{
      label: 'Employment-to-population ratio',
      data: regions.map(row => row.employment_to_population_ratio),
      backgroundColor: COLORS[0],
      borderRadius: 6
    }]
  };

  const unemploymentData = {
    labels: regions.map(row => cleanLabel(row.region_name)),
    datasets: [{
      label: 'Unemployment rate',
      data: regions.map(row => row.unemployment_rate),
      backgroundColor: COLORS[1],
      borderRadius: 6
    }]
  };

  return (
    <div className="page-content">
      <section className="welcome-section">
        <div className="welcome-copy">
          <span className="eyebrow">SOUTH KOREA · LABOR MARKET</span>
          <h2>A clearer view of work and employment</h2>
          <p>
            Explore city-level labor indicators, compare trends over time, and see how
            different groups and industries are changing.
          </p>
        </div>
        <Link to="/regional" className="welcome-action">
          Explore regional data <span aria-hidden="true">→</span>
        </Link>
      </section>

      <div className="stats-grid">
        <StatCard
          title="Records in the database"
          value={recordCount(summary.totalRecords)}
          description="Regional and industry records"
          accent="blue"
        />
        <StatCard
          title="Regional records"
          value={recordCount(summary.regionalRecords)}
          description="Employment and population indicators"
          accent="green"
        />
        <StatCard
          title="Industry records"
          value={recordCount(summary.industryRecords)}
          description="Wages and working-time indicators"
          accent="orange"
        />
        <StatCard
          title="Latest regional data"
          value={latestYear}
          description="Most recent year available"
          accent="purple"
        />
      </div>

      <DataQualityNotice dataQuality={summary.dataQuality} scope="all available years" />

      {regions.length > 0 && (
        <div className="stats-grid three highlight-stats">
          <StatCard
            title={`Highest employment ratio · ${latestYear}`}
            value={topEmployment ? cleanLabel(topEmployment.region_name) : '—'}
            description={topEmployment
              ? `${formatNumber(topEmployment.employment_to_population_ratio)}% employment-to-population ratio`
              : 'No comparable value'}
          />
          <StatCard
            title={`Highest unemployment · ${latestYear}`}
            value={topUnemployment ? cleanLabel(topUnemployment.region_name) : '—'}
            description={topUnemployment
              ? `${formatNumber(topUnemployment.unemployment_rate)}% unemployment rate`
              : 'No comparable value'}
          />
          <StatCard
            title={`Lowest unemployment · ${latestYear}`}
            value={lowUnemployment ? cleanLabel(lowUnemployment.region_name) : '—'}
            description={lowUnemployment
              ? `${formatNumber(lowUnemployment.unemployment_rate)}% unemployment rate`
              : 'No comparable value'}
          />
        </div>
      )}

      <ChartCard
        title="Labor market trends"
        subtitle="Average across the available major cities · Total gender"
        empty={trend.length === 0}
      >
        <Line
          data={trendData}
          options={lineOptions({
            title: 'Employment-to-population ratio and unemployment rate',
            yLabel: 'Percent (%)',
            unit: '%'
          })}
        />
      </ChartCard>

      <div className="two-column">
        <ChartCard
          title="Employment by city"
          subtitle={`Latest available year · ${latestYear}`}
          height={340}
          empty={regions.length === 0}
        >
          <Bar data={regionData} options={baseOptions({ legend: false, yLabel: 'Ratio (%)', unit: '%' })} />
        </ChartCard>

        <ChartCard
          title="Unemployment by city"
          subtitle={`Latest available year · ${latestYear}`}
          height={340}
          empty={regions.length === 0}
        >
          <Bar data={unemploymentData} options={baseOptions({ legend: false, yLabel: 'Rate (%)', unit: '%' })} />
        </ChartCard>
      </div>

      <section className="next-steps">
        <div>
          <span className="eyebrow">GO DEEPER</span>
          <h3>Choose an analysis</h3>
          <p>Start with a question, then use the filters to explore the data.</p>
        </div>
        <div className="quick-links">
          <Link to="/regional" className="quick-link">Regional employment <span>→</span></Link>
          <Link to="/gender" className="quick-link">Gender analysis <span>→</span></Link>
          <Link to="/unemployment" className="quick-link">Unemployment <span>→</span></Link>
          <Link to="/industry" className="quick-link">Industry trends <span>→</span></Link>
          <Link to="/tables" className="quick-link strong">Browse database tables <span>→</span></Link>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
