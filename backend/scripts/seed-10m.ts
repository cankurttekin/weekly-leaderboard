import { Pool } from 'pg';

const TOTAL_USERS = 10_000_000;
const BATCH_SIZE = 5000;

const REGIONS = ['NA', 'EU', 'ASIA', 'SA', 'OC'] as const;
const REGION_WEIGHTS = [0.35, 0.30, 0.20, 0.10, 0.05];

const FIRST_NAMES = [
  'pro', 'mega', 'super', 'ultra', 'hyper', 'cool', 'epic', 'ninja', 'cyber', 'dark',
  'shadow', 'blaze', 'storm', 'frost', 'thunder', 'lightning', 'phantom', 'ghost', 'crimson', 'midnight',
  'silver', 'golden', 'iron', 'steel', 'blade', 'arrow', 'swift', 'rapid', 'turbo', 'quantum',
  'alpha', 'beta', 'gamma', 'delta', 'omega', 'zero', 'neo', 'void', 'prime', 'apex',
  'wild', 'mad', 'raw', 'red', 'blue', 'night', 'solar', 'lunar', 'nova', 'storm',
];

const LAST_NAMES = [
  'player', 'gamer', 'hunter', 'killer', 'wolf', 'tiger', 'eagle', 'dragon', 'phoenix', 'warrior',
  'knight', 'ranger', 'assassin', 'wizard', 'beast', 'lord', 'master', 'ace', 'king', 'queen',
  'star', 'hero', 'chief', 'boss', 'legend', 'champ', 'victor', 'flash', 'slash', 'strike',
  'storm', 'bolt', 'force', 'spirit', 'shadow', 'blade', 'fury', 'rage', 'wrath', 'crest',
  'peak', 'zone', 'core', 'wave', 'surge', 'drift', 'forge', 'shield', 'saber', 'blaze',
];

function weightedRandom(): string {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < REGIONS.length; i++) {
    acc += REGION_WEIGHTS[i];
    if (r <= acc) return REGIONS[i];
  }
  return REGIONS[REGIONS.length - 1];
}

function randomLevel(): number {
  const r = Math.random();
  if (r < 0.10) return Math.floor(Math.random() * 20) + 1;
  if (r < 0.35) return Math.floor(Math.random() * 20) + 21;
  if (r < 0.65) return Math.floor(Math.random() * 20) + 41;
  if (r < 0.85) return Math.floor(Math.random() * 20) + 61;
  return Math.floor(Math.random() * 19) + 81;
}

function generateUsername(index: number): string {
  const num = index % 10000;
  const combo = Math.floor(index / 10000);
  const firstIdx = combo % FIRST_NAMES.length;
  const lastIdx = Math.floor(combo / FIRST_NAMES.length) % LAST_NAMES.length;
  return `${FIRST_NAMES[firstIdx]}_${LAST_NAMES[lastIdx]}${num}`;
}

async function seed(): Promise<void> {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'leaderboard',
    user: process.env.DB_USER || 'leaderboard',
    password: process.env.DB_PASSWORD || 'leaderboard_dev',
  });

  console.log(`Seeding ${TOTAL_USERS.toLocaleString()} players...`);
  const startTime = Date.now();

  for (let start = 0; start < TOTAL_USERS; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE, TOTAL_USERS);
    const batchSize = end - start;

    const values: string[] = [];
    const params: (string | number)[] = [];

    for (let i = 0; i < batchSize; i++) {
      const idx = start + i;
      const username = generateUsername(idx);
      const region = weightedRandom();
      const level = randomLevel();

      const offset = i * 3;
      values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
      params.push(username, region, level);
    }

    try {
      await pool.query(
        `INSERT INTO players (username, region, level) VALUES ${values.join(', ')} ON CONFLICT (username) DO NOTHING`,
        params,
      );
    } catch (err) {
      console.error(`Batch at ${start} failed:`, (err as Error).message);
    }

    if (start % (BATCH_SIZE * 20) === 0 || end >= TOTAL_USERS) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const pct = ((end / TOTAL_USERS) * 100).toFixed(1);
      console.log(`  ${end.toLocaleString()} / ${TOTAL_USERS.toLocaleString()} (${pct}%) — ${elapsed}s`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const result = await pool.query('SELECT COUNT(*)::int AS count FROM players');
  console.log(`\nDone in ${elapsed}s. Total players: ${result.rows[0].count.toLocaleString()}`);
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
