const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const gameRoutes = require('./routes/gameRoutes');
const { notFound, errorHandler } = require('./middleware/error');

function createApp() {
  const app = express();

  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  const authLimiter = rateLimit({ windowMs: 60 * 1000, limit: 20 });
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/quizzes', quizRoutes);
  app.use('/api/games', gameRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
