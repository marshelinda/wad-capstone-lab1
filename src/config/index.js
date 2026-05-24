require('dotenv').config(); // Muat .env ke process.env
const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  env: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'WAD Capstone API',
  version: process.env.APP_VERSION || '1.0.0',
};

module.exports = config;