import { Pool } from 'pg';
import Redis from 'ioredis';

function getCurrentWeekId(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  return now.getFullYear() * 100 + Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

function weightedRandomEarning(): number {
  const r = Math.random();
  if (r < 0.001) return Math.floor(Math.random() * 900_000) + 100_000; // top 0.1%
  if (r < 0.01) return Math.floor(Math.random() * 90_000) + 10_000;   // top 1%
  if (r < 0.1) return Math.floor(Math.random() * 9_000) + 1_000;      // top 10%
  return Math.floor(Math.random() * 900) + 100;                       // rest
}

async function seed(): Promise<void> {
  const weekId = getCurrentWeekId();
  console.log(`Seeding earnings for week ${weekId}...`);

  const pgPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'leaderboard',
    user: process.env.DB_USER || 'leaderboard',
    password: process.env.DB_PASSWORD || 'leaderboard_dev',
  });

  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  });

  const playersResult = await pgPool.query('SELECT id FROM players');
  const players = playersResult.rows.map((r: { id: string }) => r.id);
  console.log(`Found ${players.length} players`);

  const leaderboardKey = `leaderboard:weekly:${weekId}`;
  const poolKey = `leaderboard:pool:${weekId}`;
  const totalKey = `leaderboard:total-earnings:${weekId}`;

  let totalEarnings = 0;
  const pipeline = redis.pipeline();
  const batchSize = 500;

  for (let i = 0; i < players.length; i++) {
    const earnings = weightedRandomEarning();
    totalEarnings += earnings;

    pipeline.zincrby(leaderboardKey, earnings, players[i]);

    if ((i + 1) % batchSize === 0 || i === players.length - 1) {
      const pgBatch = [];
      for (let j = i - ((i % batchSize)); j <= i; j++) {
        if (players[j]) {
          pgBatch.push(players[j]);
        }
      }
      // We won't batch PG upserts for simplicity - just a simplified approach
    }
  }

  const poolAmount = Math.floor(totalEarnings * 0.02);
  pipeline.set(poolKey, poolAmount.toString());
  pipeline.set(totalKey, totalEarnings.toString());

  await pipeline.exec();
  console.log(`Redis data seeded: ${players.length} players, total earnings: ${totalEarnings}, pool: ${poolAmount}`);

  // Simplified: just save a representative sample to PG
  const top100 = await redis.zrevrange(leaderboardKey, 0, 99, 'WITHSCORES');
  console.log('Top 100 players:');
  for (let i = 0; i < top100.length; i += 2) {
    const playerId = top100[i];
    const score = parseInt(top100[i + 1], 10);
    console.log(`  #${i / 2 + 1}: ${playerId} - ${score.toLocaleString()}`);

    await pgPool.query(
      `INSERT INTO weekly_earnings (player_id, week_id, earnings, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (player_id, week_id)
       DO UPDATE SET earnings = $3, updated_at = NOW()`,
      [playerId, weekId, score],
    );
  }

  await pgPool.query(
    `INSERT INTO weekly_pools (week_id, total_earnings, pool_amount)
     VALUES ($1, $2, $3)
     ON CONFLICT (week_id) DO UPDATE SET total_earnings = $2, pool_amount = $3`,
    [weekId, totalEarnings, poolAmount],
  );

  console.log('PG data seeded.');
  console.log(`Pool amount: ${poolAmount.toLocaleString()}`);

  await redis.quit();
  await pgPool.end();
}

seed().catch((err) => {
  console.error('Seed earnings failed:', err);
  process.exit(1);
});
