import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

Chart.defaults.font.family = "'Segoe UI', Arial, Helvetica, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#59677a';
Chart.defaults.animation.duration = 500;
