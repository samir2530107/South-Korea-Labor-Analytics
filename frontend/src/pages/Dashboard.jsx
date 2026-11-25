import { Link } from 'react-router-dom';
import { Bar, Line } from 'react-chartjs-2';

import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import useFetch from '../hooks/useFetch';
import { getDashboardSummary } from '../services/api';
import { baseOptions, lineDataset, lineOptions, formatNumber, COLORS } from '../utils/chartUtils';

function Dashboard() {
  const { data: summary, loading, error, reload } = useFetch(getDashboardSummary, []);

  if (loading && !summary) return <Loader text="Loading database information..." />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!summary) return null;

  const regions = summary.regions || [];
  const trend = summary.trend || [];

  const topEmployment = [...regions]
    .filter(r => r.employment_to_population_ratio !== null)
    .sort((a, b) => b.employment_to_population_ratio - a.employment_to_population_ratio)[0];
  const topUnemployment = [...regions]
    .filter(r => r.unemployment_rate !== null)
    .sort((a, b) => b.unemployment_rate - a.unemployment_rate)[0];
  const lowUnemployment = [...regions]
    .filter(r => r.unemployment_rate !== null)
    .sort((a, b) => a.unemployment_rate - b.unemployment_rate)[0];

  const trendData = {
    labels: trend.map(t => t.year_value),
    datasets: [
      lineDataset('Avg employment ratio (%)', trend.map(t => t.avg_employment), COLORS[0]),
      lineDataset('Avg unemployment rate (%)', trend.map(t => t.avg_unemployment), COLORS[1])
    ]
  };

  const regionData = {
    labels: regions.map(r => r.region_name),
    datasets: [
      {
        label: 'Employment-to-population ratio (%)',
        data: regions.map(r => r.employment_to_population_ratio),
        backgroundColor: COLORS[0],
        borderRadius: 6
      }
    ]
  };

  const unemploymentData = {
    labels: regions.map(r => r.region_name),
    datasets: [
      {
        label: 'Unemployment rate (%)',
        data: regions.map(r => r.unemployment_rate),
        backgroundColor: COLORS[1],
        borderRadius: 6
      }
    ]
  };

  return (
    <div className="page-content">
      <div className="welcome-section">
        <h2>Labor Market Overview</h2>
        <p>
          Explore employment, unemployment, and industry statistics across South Korea.
        </p>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Records"
          value={summary.totalRecords.toLocaleString()}
          description="Combined database records"
          accent="blue"
        />
        <StatCard
          title="Regional Statistics"
          value={summary.regionalRecords.toLocaleString()}
          description="Regional employment records"
          accent="green"
        />
        <StatCard
          title="Industry Statistics"
          value={summary.industryRecords.toLocaleString()}
          description="Industry wages and working hours records"
          accent="orange"
        />
        <StatCard
          title="Latest Regional Year"
          value={summary.latestYear ?? '—'}
          description="Most recent year with regional data"
          accent="purple"
        />
      </div>

      {regions.length > 0 && (
        <div className="stats-grid three">
          <StatCard
            title={`Highest Employment (${summary.latestYear})`}
            value={topEmployment ? topEmployment.region_name : '—'}
            description={topEmployment ? `${formatNumber(topEmployment.employment_to_population_ratio)}% employment ratio` : ''}
          />
          <StatCard
            title={`Highest Unemployment (${summary.latestYear})`}
            value={topUnemployment ? topUnemployment.region_name : '—'}
            description={topUnemployment ? `${formatNumber(topUnemployment.unemployment_rate)}% unemployment rate` : ''}
          />
          <StatCard
            title={`Lowest Unemployment (${summary.latestYear})`}
            value={lowUnemployment ? lowUnemployment.region_name : '—'}
            description={lowUnemployment ? `${formatNumber(lowUnemployment.unemployment_rate)}% unemployment rate` : ''}
          />
        </div>
      )}

      <ChartCard
        title="Seven-City Average Over Time"
        subtitle="Simple average of the seven major cities, Total gender"
        empty={trend.length === 0}
      >
        <Line data={trendData} options={lineOptions({ title: 'Employment vs Unemployment Trend', yLabel: 'Percent (%)', unit: '%' })} />
      </ChartCard>

      <div className="two-column">
        <ChartCard
          title="Employment by City"
          subtitle={`Latest year (${summary.latestYear ?? '—'})`}
          height={340}
          empty={regions.length === 0}
        >
          <Bar data={regionData} options={baseOptions({ legend: false, yLabel: 'Ratio (%)', unit: '%' })} />
        </ChartCard>

        <ChartCard
          title="Unemployment by City"
          subtitle={`Latest year (${summary.latestYear ?? '—'})`}
          height={340}
          empty={regions.length === 0}
        >
          <Bar data={unemploymentData} options={baseOptions({ legend: false, yLabel: 'Rate (%)', unit: '%' })} />
        </ChartCard>
      </div>

      <div className="quick-links">
        <Link to="/regional" className="quick-link">Regional Employment →</Link>
        <Link to="/gender" className="quick-link">Gender Analysis →</Link>
        <Link to="/unemployment" className="quick-link">Unemployment →</Link>
        <Link to="/industry" className="quick-link">Industry Analysis →</Link>
        <Link to="/tables" className="quick-link strong">View Database Tables →</Link>
      </div>
    </div>
  );
}

export default Dashboard;
