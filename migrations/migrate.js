const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

async function runMigrations() {
  let client;

  try {
    client = await pool.connect();
    console.log('Database connected. Running migrations...');
    
    const migrationFiles = fs.readdirSync(__dirname)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const migrationPath = path.join(__dirname, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      await client.query(migrationSQL);
      console.log(`Migration ${file} completed successfully`);
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('Migration failed: Could not connect to the database.');
      console.error('Set DATABASE_URL in .env with your Neon connection string, then retry.');
    } else if (error.code === '28P01') {
      console.error('Migration failed: Invalid database credentials.');
    } else {
      console.error('Migration failed:', error.message);
    }
    throw error;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runMigrations()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
