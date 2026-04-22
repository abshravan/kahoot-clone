require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/kahoot',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-insecure-secret',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  REDIS_URL: process.env.REDIS_URL || '',
};

module.exports = env;
