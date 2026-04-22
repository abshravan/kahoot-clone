/**
 * Centralised CORS configuration.
 *
 * CLIENT_ORIGIN may be:
 *   - "*"                       → allow everything (dev-only convenience)
 *   - a single origin           → e.g. "http://localhost:3000"
 *   - a comma-separated list    → "http://localhost:3000,https://app.example.com"
 *
 * This module exports:
 *   - allowedOrigins: parsed list (empty if "*")
 *   - isOriginAllowed(origin): predicate used by both Express and Socket.IO
 *   - corsOptions: object suitable for `cors()` middleware and Socket.IO
 */
const env = require('./env');

function parseOrigins(raw) {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const allowedOrigins = parseOrigins(env.CLIENT_ORIGIN);
const allowAny = allowedOrigins.includes('*') || allowedOrigins.length === 0;

function isOriginAllowed(origin) {
  // Non-browser clients (curl, server-to-server) send no Origin header.
  if (!origin) return true;
  if (allowAny) return true;
  return allowedOrigins.includes(origin);
}

const corsOptions = {
  origin(origin, cb) {
    if (isOriginAllowed(origin)) return cb(null, true);
    return cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};

module.exports = { allowedOrigins, isOriginAllowed, corsOptions };
