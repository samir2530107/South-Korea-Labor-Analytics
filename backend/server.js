const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const dashboardRoutes = require('./routes/dashboard');
const regionalRoutes = require('./routes/regional');
const genderRoutes = require('./routes/gender');
const unemploymentRoutes = require('./routes/unemployment');
const industryRoutes = require('./routes/industry');
const tablesRoutes = require('./routes/tables');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Allow the React app on localhost / 127.0.0.1 (any Vite port)
app.use(cors({
  origin(origin, callback) {
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  }
}));

app.use(express.json());

// Home route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'South Korea Labor Analytics API is running!',
    database: 'south_korea_labor_market'
  });
});

// Health check: shows whether MySQL is reachable
app.get('/api/health', async (req, res) => {
  try {
    await db.testConnection();
    res.json({ success: true, server: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ success: false, server: 'ok', database: 'disconnected', message: error.message });
  }
});

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/regional', regionalRoutes);
app.use('/api/gender', genderRoutes);
app.use('/api/unemployment', unemploymentRoutes);
app.use('/api/industry', industryRoutes);
app.use('/api/tables', tablesRoutes);

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Global error handler (4 arguments are required by Express)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// A crash in one request must never stop the server
process.on('unhandledRejection', reason => console.error('Unhandled rejection:', reason));
process.on('uncaughtException', error => console.error('Uncaught exception:', error.message));

const server = app.listen(PORT, async () => {
  console.log('--------------------------------------');
  console.log('South Korea Labor Analytics API');
  console.log(`Server:   http://localhost:${PORT}`);
  console.log('Database: south_korea_labor_market');
  try {
    await db.testConnection();
    console.log('MySQL:    connected');
  } catch (error) {
    console.log(`MySQL:    NOT CONNECTED (${error.code || error.message})`);
    console.log('          Start MySQL and check backend/config/db.js');
  }
  console.log('--------------------------------------');
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Close the other backend window and try again.`);
  } else {
    console.error('Server error:', error.message);
  }
  process.exit(1);
});
