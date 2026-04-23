const { Server } = require('socket.io');
const { isOriginAllowed } = require('../config/cors');
const { registerGameHandlers } = require('./gameEngine');
const env = require('../config/env');

async function attachSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin(origin, cb) {
        if (isOriginAllowed(origin)) return cb(null, true);
        return cb(new Error(`Origin ${origin} not allowed by CORS`));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // When REDIS_URL is set, fan out Socket.IO rooms across the cluster via
  // pub/sub. Safe no-op when unset — single-process mode still works.
  if (env.REDIS_URL) {
    try {
      const { createAdapter } = require('@socket.io/redis-adapter');
      const { createClient } = require('redis');
      const pubClient = createClient({ url: env.REDIS_URL });
      const subClient = pubClient.duplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);
      io.adapter(createAdapter(pubClient, subClient));
      console.log('[sockets] Redis adapter enabled');
    } catch (err) {
      console.error('[sockets] Redis adapter failed, falling back to in-memory:', err.message);
    }
  }

  io.on('connection', (socket) => {
    registerGameHandlers(io, socket);
  });

  return io;
}

module.exports = { attachSockets };
