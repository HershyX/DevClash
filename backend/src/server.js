import http from 'http';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { createApp } from './app.js';
import { createSocketServer } from './sockets/index.js';

const app = createApp();
const server = http.createServer(app);

// Real-time layer (battle rooms, live notifications)
const io = createSocketServer(server);

async function start() {
  await connectDB();

  server.listen(env.port, () => {
    console.log(`[server] DevClash backend running on http://localhost:${env.port}`);
    console.log(`[server] Allowed CORS origins: ${env.clientOrigins.join(', ')}`);
  });
}

async function shutdown(signal) {
  console.log(`\n[server] ${signal} received, shutting down gracefully...`);
  io.close();
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
  // Force-exit safety net
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled rejection:', reason);
});

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
