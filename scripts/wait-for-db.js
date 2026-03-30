const net = require('net');

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://bluecollar_user:bluecollar_password@localhost:5432/bluecollar_dev';

// Parse connection string
const url = new URL(DATABASE_URL);
const host = url.hostname || 'localhost';
const port = parseInt(url.port || '5432', 10);

const MAX_RETRIES = 30;
const RETRY_INTERVAL = 1000; // 1 second
let retries = 0;

function checkDatabaseConnection() {
  console.log(
    `⏳ [DB Check] Attempting to connect to PostgreSQL at ${host}:${port} (${retries + 1}/${MAX_RETRIES})...`,
  );

  const socket = net.createConnection(port, host);

  socket.setTimeout(5000);

  socket.on('connect', () => {
    socket.destroy();
    console.log('✅ [DB Check] PostgreSQL is ready!');
    process.exit(0);
  });

  socket.on('error', (error) => {
    retries++;

    if (retries >= MAX_RETRIES) {
      console.error(
        `❌ [DB Check] Failed to connect to PostgreSQL after ${MAX_RETRIES} attempts.`,
      );
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }

    console.log(
      `⏳ [DB Check] Connection failed (${error.code}), retrying in ${RETRY_INTERVAL / 1000}s...`,
    );
    setTimeout(checkDatabaseConnection, RETRY_INTERVAL);
  });

  socket.on('timeout', () => {
    socket.destroy();
    retries++;

    if (retries >= MAX_RETRIES) {
      console.error(
        `❌ [DB Check] Connection timeout after ${MAX_RETRIES} attempts.`,
      );
      process.exit(1);
    }

    console.log(
      `⏳ [DB Check] Connection timeout, retrying in ${RETRY_INTERVAL / 1000}s...`,
    );
    setTimeout(checkDatabaseConnection, RETRY_INTERVAL);
  });
}

checkDatabaseConnection();
