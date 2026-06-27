import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function migrate(): Promise<void> {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'leaderboard',
    user: process.env.DB_USER || 'leaderboard',
    password: process.env.DB_PASSWORD || 'leaderboard_dev',
  });

  const sqlPath = path.resolve(__dirname, '001_initial.sql');
  console.log(`Running migration: ${sqlPath}`);
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  await pool.query(sql);
  console.log('Migration complete.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
