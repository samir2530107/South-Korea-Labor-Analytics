export const COLORS = [
  '#3978d5', '#e28aab', '#36a38a', '#e6a23c',
  '#9275cc', '#5c9ead', '#d16b5a', '#7a8b99',
  '#a3c14a', '#c75bb0', '#4fb0e6', '#8a6d3b'
];

// Strip underscores from any label/name string coming from the DB
export function cleanLabel(value) {
  if (typeof value === 'string') return value.replace(/_/g, ' ');
  return value;
}

export const MALE_COLOR = '#3978d5';
export const FEMALE_COLOR = '#e28aab';

export function formatNumber(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits
  });
}

export function compact(value) {
  if (value === null || value === undefined) return '—';
  return Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function baseOptions({ title, yLabel, xLabel, legend = true, horizontal = false, stacked = false, unit = '' }) {
  const valueAxis = {
    beginAtZero: true,
    stacked,
    title: { display: Boolean(yLabel), text: yLabel }
  };
  const categoryAxis = {
    stacked,
    title: { display: Boolean(xLabel), text: xLabel },
    ticks: { autoSkip: false, maxRotation: horizontal ? 0 : 45 }
  };

  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: legend, position: 'top' },
      title: { display: Boolean(title), text: title, font: { size: 14 } },
      tooltip: {
        callbacks: {
          label: ctx => {
            const v = horizontal ? ctx.parsed.x : ctx.parsed.y;
            const name = ctx.dataset.label ? `${ctx.dataset.label}: ` : '';
            return `${name}${formatNumber(v, 2)}${unit}`;
          }
        }
      }
    },
    scales: horizontal
      ? { x: valueAxis, y: categoryAxis }
      : { y: valueAxis, x: categoryAxis }
  };
}

export function lineOptions({ title, yLabel, unit = '' }) {
  const opts = baseOptions({ title, yLabel, xLabel: 'Year', unit });
  opts.scales.x.ticks = { autoSkip: true, maxTicksLimit: 14 };
  opts.scales.y.beginAtZero = false;
  return opts;
}

export function lineDataset(label, data, color) {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: color,
    borderWidth: 2,
    pointRadius: 2,
    pointHoverRadius: 5,
    tension: 0.25,
    spanGaps: true
  };
}

// Builds [{label: [values per year]}] from long-format rows.
export function pivotByYear(rows, groupKey, valueKey) {
  const years = [...new Set(rows.map(r => r.year_value))].sort((a, b) => a - b);
  const groups = [...new Set(rows.map(r => r[groupKey]))];
  const datasets = groups.map(group => ({
    group,
    values: years.map(year => {
      const row = rows.find(r => r[groupKey] === group && r.year_value === year);
      return row ? row[valueKey] : null;
    })
  }));
  return { years, datasets };
}
