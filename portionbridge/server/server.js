const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const { validateEnvironment } = require('./config/environment');
validateEnvironment();

const app = require('./app');
const { testConnection } = require('./config/db');
const { validateDatabaseSchema } = require('./config/schema');
const { initializeSocket } = require('./sockets/index');
const { ensureUploadDirsExist } = require('./utils/uploadConfig');
const { getAllowedOrigins } = require('./config/cors');

const PORT = process.env.PORT || 5000;

// Create raw HTTP server so Express and Socket.io can share the same port
const httpServer = http.createServer(app);

// Attach Socket.io to the same server. Same allowed-origins source as
// Express's CORS config (config/cors.js) — see that file for the
// production-vs-development origin rules.
const io = new Server(httpServer, {
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
});

initializeSocket(io);

// Make io accessible in controllers later via req.app.get('io')
app.set('io', io);

async function startServer() {
  ensureUploadDirsExist();

  const databaseConnected = await testConnection();
  if (!databaseConnected) {
    throw new Error('Database connection failed. Server will not start.');
  }

  await validateDatabaseSchema();

  httpServer.listen(PORT, () => {
    console.log(`[Server] PortionBridge API running on http://localhost:${PORT}`);
    console.log(`[Server] API base: http://localhost:${PORT}/api/v1`);
  });
}

startServer().catch((error) => {
  console.error('[Startup] Server initialization failed:', error.message);
  process.exit(1);
});
