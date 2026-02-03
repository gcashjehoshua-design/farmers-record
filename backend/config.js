// Configuration file for the application

require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  db: {
    path: process.env.DB_PATH || './database/farmers_record.db'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  }
};

module.exports = config;
