const http = require('http');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const { createApp } = require('./app');
const { attachSockets } = require('./sockets');

async function main() {
  await connectDB();
  const app = createApp();
  const httpServer = http.createServer(app);
  await attachSockets(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`[server] listening on :${env.PORT}`);
  });
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
