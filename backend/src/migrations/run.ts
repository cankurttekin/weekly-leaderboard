import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations(): Promise<void> {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'leaderboard',
    user: process.env.DB_USER || 'leaderboard',
    password: process.env.DB_PASSWORD || 'leaderboard_dev',
  });

  const migrationsDir = path.resolve(__dirname);
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    console.log(`Running migration: ${file}`);
    await pool.query(sql);
    console.log(`Completed migration: ${file}`);
  }

  await pool.end();
  console.log('All migrations complete.');
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
