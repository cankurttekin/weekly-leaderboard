import { Pool } from 'pg';

const POOL_SIZE = 10_000;

const REGIONS = ['NA', 'EU', 'ASIA', 'SA', 'OC'];
const REGION_WEIGHTS = [0.35, 0.30, 0.20, 0.10, 0.05];

function weightedRegion(): string {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < REGIONS.length; i++) {
    acc += REGION_WEIGHTS[i];
    if (r <= acc) return REGIONS[i];
  }
  return 'NA';
}

const FIRST_NAMES = [
  'pro', 'mega', 'super', 'ultra', 'hyper', 'cool', 'epic', 'ninja', 'cyber', 'dark',
  'shadow', 'blaze', 'storm', 'frost', 'thunder', 'lightning', 'phantom', 'ghost', 'crimson', 'midnight',
  'silver', 'golden', 'iron', 'steel', 'blade', 'arrow', 'swift', 'rapid', 'turbo', 'quantum',
];

const LAST_NAMES = [
  'player', 'gamer', 'hunter', 'killer', 'wolf', 'tiger', 'eagle', 'dragon', 'phoenix', 'warrior',
  'knight', 'ranger', 'assassin', 'wizard', 'beast', 'lord', 'master', 'ace', 'king', 'queen',
  'star', 'hero', 'chief', 'boss', 'legend', 'champ', 'victor', 'flash', 'slash', 'strike',
];

function randomUsername(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const num = Math.floor(Math.random() * 999);
  return `${first}_${last}${num}`;
}

function randomLevel(): number {
  // weighted toward mid-levels
  const r = Math.random();
  if (r < 0.1) return Math.floor(Math.random() * 20) + 1;    // low
  if (r < 0.35) return Math.floor(Math.random() * 20) + 21;  // mid-low
  if (r < 0.65) return Math.floor(Math.random() * 20) + 41;  // mid
  if (r < 0.85) return Math.floor(Math.random() * 20) + 61;  // mid-high
  return Math.floor(Math.random() * 19) + 81;                  // high
}

async function seed(): Promise<void> {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'leaderboard',
    user: process.env.DB_USER || 'leaderboard',
    password: process.env.DB_PASSWORD || 'leaderboard_dev',
  });

  const used = new Set<string>();
  const batchSize = 500;

  console.log(`Seeding ${POOL_SIZE} players with regions and levels...`);

  for (let i = 0; i < POOL_SIZE; i += batchSize) {
    const batch: { username: string; region: string; level: number }[] = [];
    while (batch.length < batchSize && used.size < POOL_SIZE) {
      const username = randomUsername();
      if (!used.has(username)) {
        used.add(username);
        batch.push({ username, region: weightedRegion(), level: randomLevel() });
      }
    }

    const values = batch.map(
      (_, idx) => `($${idx * 3 + 1}, $${idx * 3 + 2}, $${idx * 3 + 3})`,
    ).join(', ');
    const params = batch.flatMap((b) => [b.username, b.region, b.level]);

    try {
      await pool.query(
        `INSERT INTO players (username, region, level) VALUES ${values}
         ON CONFLICT (username) DO UPDATE SET region = EXCLUDED.region, level = EXCLUDED.level`,
        params,
      );
    } catch (err) {
      console.error('Batch insert failed:', (err as Error).message);
    }

    if ((i + batchSize) % 2000 === 0 || i + batchSize >= POOL_SIZE) {
      console.log(`Inserted ${Math.min(i + batchSize, POOL_SIZE)} / ${POOL_SIZE} players`);
    }
  }

  const result = await pool.query('SELECT COUNT(*)::int AS count, COUNT(DISTINCT region) AS regions FROM players');
  console.log(`Total players: ${result.rows[0].count}, regions: ${result.rows[0].regions}`);

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
