require('dotenv').config();
const app = require('./app');
const pool = require('./config/database');

const PORT = process.env.PORT || 3000;

const requiredEnvVars = ['JWT_SECRET'];
const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

if (!process.env.DATABASE_URL && !process.env.DB_PASSWORD) {
  console.error('Database configuration missing. Set DATABASE_URL (Neon) or DB_PASSWORD.');
  process.exit(1);
}

async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API base URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
