require('dotenv').config();
const app = require('./app');
const { pool } = require('./models/db');
const { startSyncScheduler } = require('./services/syncService');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Test DB connection
    await pool.query('SELECT 1');
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      startSyncScheduler();
      console.log('Sync scheduler started');
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
