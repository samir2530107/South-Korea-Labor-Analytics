import { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';

import ChartCard from '../components/ChartCard';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import Select from '../components/Select';
import useFetch from '../hooks/useFetch';
import { getGenderEmployment, getGenderTrend, getGenderYears } from '../services/api';
import { baseOptions, lineDataset, lineOptions, cleanLabel, FEMALE_COLOR, MALE_COLOR } from '../utils/chartUtils';

function GenderAnalysis() {
  const [year, setYear] = useState('');
  const [region, setRegion] = useState('');

  const years = useFetch(getGenderYears, []);
  const current = useFetch(() => getGenderEmployment(year), [year]);
  const trend = useFetch(getGenderTrend, []);

  if ((current.loading && !current.data) || (trend.loading && !trend.data) || (years.loading && !years.data)) {
    return <Loader text="Loading gender analysis data..." />;
  }
  if (current.error) return <ErrorBox message={current.error} onRetry={current.reload} />;
  if (trend.error) return <ErrorBox message={trend.error} onRetry={trend.reload} />;
  if (years.error) return <ErrorBox message={years.error} onRetry={years.reload} />;

  const data = current.data?.data || [];
  const selectedYear = current.data?.year ?? null;
  const trendRows = trend.data?.data || [];

  const regions = [...new Set(data.map(d => d.region_name))];
  const value = (gender, metric, name) => {
    const rec = data.find(d => d.region_name === name && d.gender_name === gender);
    return rec ? rec[metric] : null;
  };
  const series = metric => ({
    male: regions.map(r => value('Male', metric, r)),
    female: regions.map(r => value('Female', metric, r))
  });

  const emp = series('employment_to_population_ratio');
  const unemp = series('unemployment_rate');

  const grouped = (s) => ({
    labels: regions.map(cleanLabel),
    datasets: [
      { label: 'Male', data: s.male, backgroundColor: MALE_COLOR, borderRadius: 5 },
      { label: 'Female', data: s.female, backgroundColor: FEMALE_COLOR, borderRadius: 5 }
    ]
  });

  const gapValues = regions.map((_, i) =>
    emp.male[i] !== null && emp.female[i] !== null ? Number((emp.male[i] - emp.female[i]).toFixed(2)) : null
  );
  const gapData = {
    labels: regions.map(cleanLabel),
    datasets: [{ label: 'Male minus female (percentage points)', data: gapValues, backgroundColor: '#36a38a', borderRadius: 5 }]
  };

  // Trend for one region
  const trendRegions = [...new Set(trendRows.map(r => r.region_name))];
  const activeRegion = region && trendRegions.includes(region) ? region : trendRegions[0];
  const regionTrend = trendRows.filter(r => r.region_name === activeRegion);
  const trendYears = [...new Set(regionTrend.map(r => r.year_value))].sort((a, b) => a - b);
  const pick = (gender, metric) =>
    trendYears.map(y => regionTrend.find(r => r.year_value === y && r.gender_name === gender)?.[metric] ?? null);

  const empTrend = {
    labels: trendYears,
    datasets: [
      lineDataset('Male', pick('Male', 'employment_to_population_ratio'), MALE_COLOR),
      lineDataset('Female', pick('Female', 'employment_to_population_ratio'), FEMALE_COLOR)
    ]
  };
  const unempTrend = {
    labels: trendYears,
    datasets: [
      lineDataset('Male', pick('Male', 'unemployment_rate'), MALE_COLOR),
      lineDataset('Female', pick('Female', 'unemployment_rate'), FEMALE_COLOR)
    ]
  };

  const yearList = years.data?.years || [];

  return (
    <div className="page-content">
      <div className="welcome-section">
        <h2>Gender Analysis</h2>
        <p>Compare male and female labor market conditions across South Korea's seven major cities.</p>
      </div>

      <div className="filter-bar">
        <Select
          label="Year"
          value={year || selectedYear}
          onChange={setYear}
          options={yearList.map(y => ({ value: y, label: y }))}
        />
        <Select
          label="City (trend charts)"
          value={activeRegion}
          onChange={setRegion}
          options={trendRegions.map(r => ({ value: r, label: r }))}
        />
        <span className="filter-note">Categories: Male and Female</span>
      </div>

      <ChartCard title="Gender Employment Comparison" subtitle="Employment-to-population ratio by city" empty={data.length === 0}>
        <Bar data={grouped(emp)} options={baseOptions({ title: `Male vs Female Employment (${selectedYear ?? ''})`, yLabel: 'Employment ratio (%)', unit: '%' })} />
      </ChartCard>

      <ChartCard title="Gender Unemployment Comparison" subtitle="Unemployment rate by city" empty={data.length === 0}>
        <Bar data={grouped(unemp)} options={baseOptions({ title: `Male vs Female Unemployment (${selectedYear ?? ''})`, yLabel: 'Unemployment rate (%)', unit: '%' })} />
      </ChartCard>

      <ChartCard title="Employment Gender Gap" subtitle="Male ratio minus female ratio, in percentage points" height={340} empty={data.length === 0}>
        <Bar data={gapData} options={baseOptions({ legend: false, yLabel: 'Percentage points', unit: ' pts' })} />
      </ChartCard>

      <div className="two-column">
        <ChartCard title={`Employment Trend · ${activeRegion ?? ''}`} subtitle="Male vs female over time" height={340} empty={regionTrend.length === 0}>
          <Line data={empTrend} options={lineOptions({ yLabel: 'Employment ratio (%)', unit: '%' })} />
        </ChartCard>
        <ChartCard title={`Unemployment Trend · ${activeRegion ?? ''}`} subtitle="Male vs female over time" height={340} empty={regionTrend.length === 0}>
          <Line data={unempTrend} options={lineOptions({ yLabel: 'Unemployment rate (%)', unit: '%' })} />
        </ChartCard>
      </div>
    </div>
  );
}

export default GenderAnalysis;
