const { Server } = require('socket.io');
const { registerGameHandlers } = require('./gameEngine');

function attachSockets(httpServer, { corsOrigin }) {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
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
