
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

// Allowed frontend origins
const allowedOrigins = [
  'https://samir2530107.github.io'
];

// CORS configuration
app.use(cors({
  origin(origin, callback) {
    // Allow requests without an Origin (e.g., server-to-server or curl)
    if (!origin) {
      return callback(null, true);
    }

    // Allow GitHub Pages production website
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow local development on localhost or 127.0.0.1
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS'));
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

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await db.testConnection();
    res.json({
      success: true,
      server: 'ok',
      database: 'connected'
    });
  } catch {
    res.status(503).json({
      success: false,
      server: 'ok',
      database: 'disconnected',
      message: 'The API is running, but MySQL is unavailable. Check the database service and DB_* settings.'
    });
  }
});

// API routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/regional', regionalRoutes);
app.use('/api/gender', genderRoutes);
app.use('/api/unemployment', unemploymentRoutes);
app.use('/api/industry', industryRoutes);
app.use('/api/tables', tablesRoutes);

// Unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Handle unexpected errors
process.on('unhandledRejection', reason => {
  console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error.message);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log('--------------------------------------');
  console.log('South Korea Labor Analytics API');
  console.log(`Server:   http://localhost:${PORT}`);
  console.log('Database: south_korea_labor_market');

  try {
    await db.testConnection();
    console.log('MySQL:    connected');
  } catch (error) {
    console.log(`MySQL:    NOT CONNECTED (${error.code || error.message})`);
    console.log('          Check backend/.env and the MySQL service');
  }

  console.log('--------------------------------------');
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
  } else {
    console.error('Server error:', error.message);
  }

  process.exit(1);
});
