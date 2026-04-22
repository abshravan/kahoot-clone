const { Server } = require('socket.io');
const { isOriginAllowed } = require('../config/cors');
const { registerGameHandlers } = require('./gameEngine');

function attachSockets(httpServer) {
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

  io.on('connection', (socket) => {
    registerGameHandlers(io, socket);
  });

  return io;
}

module.exports = { attachSockets };
