const PRIZE_SHARES = {
  1: 0.20,
  2: 0.15,
  3: 0.10,
  RANGE_4_100: 0.55,
} as const;

interface Payout {
  rank: number;
  sharePct: number;
  prizeAmount: number;
}

function computePayouts(entries: { earnings: number; rank: number }[], poolAmount: number): Payout[] {
  const payouts: Payout[] = [];

  const top3 = entries.slice(0, 3);
  const rankShares: { rank: number; sharePct: number }[] = [];

  if (top3.length >= 1) rankShares.push({ rank: 1, sharePct: PRIZE_SHARES[1] });
  if (top3.length >= 2) rankShares.push({ rank: 2, sharePct: PRIZE_SHARES[2] });
  if (top3.length >= 3) rankShares.push({ rank: 3, sharePct: PRIZE_SHARES[3] });

  for (const entry of rankShares) {
    const player = entries[entry.rank - 1];
    payouts.push({
      rank: entry.rank,
      sharePct: entry.sharePct * 100,
      prizeAmount: Math.floor(poolAmount * entry.sharePct),
    });
  }

  const rest = entries.slice(3, 100);
  if (rest.length > 0) {
    const remainingPool = poolAmount * PRIZE_SHARES.RANGE_4_100;
    const totalWeight = rest.reduce((sum, _, i) => sum + (rest.length - i), 0);

    for (let i = 0; i < rest.length; i++) {
      const weight = rest.length - i;
      const sharePct = (PRIZE_SHARES.RANGE_4_100 * weight) / totalWeight;
      payouts.push({
        rank: i + 4,
        sharePct: sharePct * 100,
        prizeAmount: Math.floor(remainingPool * (weight / totalWeight)),
      });
    }
  }

  return payouts;
}

function verify(): void {
  const poolAmount = 1_000_000; // 1M pool for testing

  const entries = Array.from({ length: 100 }, (_, i) => ({
    rank: i + 1,
    earnings: 100_000 - i * 500,
  }));

  const payouts = computePayouts(entries, poolAmount);

  const totalDistributed = payouts.reduce((sum, p) => sum + p.prizeAmount, 0);
  const top1 = payouts.find((p) => p.rank === 1)!;
  const top2 = payouts.find((p) => p.rank === 2)!;
  const top3 = payouts.find((p) => p.rank === 3)!;

  console.log('=== Prize Distribution Verification ===');
  console.log(`Pool Amount: ${poolAmount.toLocaleString()}`);
  console.log('');
  console.log(`1st place: ${top1.prizeAmount.toLocaleString()} (${(top1.sharePct).toFixed(2)}%) — expected 20% = ${(poolAmount * 0.2).toLocaleString()}`);
  console.log(`2nd place: ${top2.prizeAmount.toLocaleString()} (${(top2.sharePct).toFixed(2)}%) — expected 15% = ${(poolAmount * 0.15).toLocaleString()}`);
  console.log(`3rd place: ${top3.prizeAmount.toLocaleString()} (${(top3.sharePct).toFixed(2)}%) — expected 10% = ${(poolAmount * 0.1).toLocaleString()}`);
  console.log('');

  const top3Pool = top1.prizeAmount + top2.prizeAmount + top3.prizeAmount;
  const restPool = totalDistributed - top3Pool;
  console.log(`Top 3 total: ${top3Pool.toLocaleString()} (expected ${poolAmount * 0.45})`);
  console.log(`Ranks 4-100 total: ${restPool.toLocaleString()} (expected ${poolAmount * 0.55})`);
  console.log(`Total distributed: ${totalDistributed.toLocaleString()}`);
  console.log(`Left undistributed: ${(poolAmount - totalDistributed).toLocaleString()}`);
  console.log('');

  const tolerance = Math.abs(top1.prizeAmount - poolAmount * 0.2);
  console.log(`1st tolerance: ${tolerance} (${((tolerance / (poolAmount * 0.2)) * 100).toFixed(4)}%)`);

  const top3Pct = top3Pool / poolAmount * 100;
  const restPct = restPool / poolAmount * 100;

  console.log('');
  console.log('=== Summary ===');
  console.log(`Top 3: ${top3Pct.toFixed(2)}% of pool`);
  console.log(`Ranks 4-100: ${restPct.toFixed(2)}% of pool`);
  console.log(`Distributed: ${(totalDistributed / poolAmount * 100).toFixed(2)}% of pool`);

  if (Math.abs(top3Pct - 45) < 1 && Math.abs(restPct - 55) < 1) {
    console.log('');
    console.log('✓ Distribution formula verified!');
  } else {
    console.log('');
    console.log('✗ Distribution formula has issues!');
    process.exit(1);
  }
}

verify();
