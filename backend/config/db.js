
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const ca = process.env.DB_SSL_CA
  ? process.env.DB_SSL_CA.replace(/\\n/g, '\n')
  : fs.readFileSync(
      path.resolve(__dirname, '..', process.env.DB_SSL_CA_PATH)
    );

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: {
    ca,
    rejectUnauthorized: true
  },

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
