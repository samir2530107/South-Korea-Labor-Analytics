require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function sslOptions() {
  if (process.env.DB_SSL_CA) {
    return {
      ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n'),
      rejectUnauthorized: true
    };
  }

  if (process.env.DB_SSL_CA_PATH) {
    const caPath = path.resolve(__dirname, '..', process.env.DB_SSL_CA_PATH);
    if (!fs.existsSync(caPath)) {
      throw new Error(`Database SSL certificate not found: ${caPath}`);
    }

    return {
      ca: fs.readFileSync(caPath),
      rejectUnauthorized: true
    };
  }

  return process.env.DB_SSL === 'true' ? {} : undefined;
}

const ssl = sslOptions();
const db = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'south_korea_labor_market',
  ...(ssl ? { ssl } : {}),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.testConnection = async () => {
  const connection = await db.getConnection();

  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
};

module.exports = db;
