import { Injectable, Logger } from '@nestjs/common';
import { ProviderFactory } from '../../providers/provider-factory';
import { RedisLeaderboardProvider } from '../../providers/redis-leaderboard.provider';
import { PostgresEarningsProvider } from '../../providers/postgres-earnings.provider';
import { PayoutRecord } from '../../providers/database.abstract';
import { getCurrentWeekId, getMondayReset } from './ranking.service';
import { PrizePoolResponseDto } from '../dto/prize-pool.dto';

export const PRIZE_SHARES = {
  1: 0.20,
  2: 0.15,
  3: 0.10,
  RANGE_4_100: 0.55,
} as const;

@Injectable()
export class PrizeService {
  private readonly logger = new Logger(PrizeService.name);
  private readonly redis: RedisLeaderboardProvider;
  private readonly postgres: PostgresEarningsProvider;

  constructor(providerFactory: ProviderFactory) {
    this.redis = providerFactory.getRedisProvider();
    this.postgres = providerFactory.getPostgresProvider();
  }

  async getPoolInfo(weekId?: number): Promise<PrizePoolResponseDto> {
    const wId = weekId ?? getCurrentWeekId();
    const [totalEarnings, poolAmount] = await Promise.all([
      this.redis.getTotalEarnings(wId),
      this.redis.getPoolAmount(wId),
    ]);

    const resetAt = getMondayReset();

    return {
      weekId: wId,
      totalEarnings,
      poolAmount,
      sharePercent: 2,
      resetAt: resetAt.toISOString(),
      countdownMs: Math.max(0, resetAt.getTime() - Date.now()),
    };
  }

  computePayouts(entries: { playerId: string; username: string; earnings: number; rank: number }[], poolAmount: number): PayoutRecord[] {
    if (entries.length === 0) return [];

    const payouts: PayoutRecord[] = [];

    const top3 = entries.slice(0, 3);
    const rankShares: { rank: number; sharePct: number }[] = [];

    if (top3.length >= 1) rankShares.push({ rank: 1, sharePct: PRIZE_SHARES[1] });
    if (top3.length >= 2) rankShares.push({ rank: 2, sharePct: PRIZE_SHARES[2] });
    if (top3.length >= 3) rankShares.push({ rank: 3, sharePct: PRIZE_SHARES[3] });

    for (const entry of rankShares) {
      const player = entries[entry.rank - 1];
      payouts.push({
        rank: entry.rank,
        playerId: player.playerId,
        username: player.username,
        earnings: player.earnings,
        sharePct: entry.sharePct * 100,
        prizeAmount: Math.floor(poolAmount * entry.sharePct),
      });
    }

    const rest = entries.slice(3, 100);
    if (rest.length > 0) {
      const remainingPool = poolAmount * PRIZE_SHARES.RANGE_4_100;
      const totalWeight = rest.reduce((sum, _, i) => sum + (rest.length - i), 0);

      for (let i = 0; i < rest.length; i++) {
        const player = rest[i];
        const weight = rest.length - i;
        const sharePct = (PRIZE_SHARES.RANGE_4_100 * weight) / totalWeight;
        payouts.push({
          rank: i + 4,
          playerId: player.playerId,
          username: player.username,
          earnings: player.earnings,
          sharePct: sharePct * 100,
          prizeAmount: Math.floor(remainingPool * (weight / totalWeight)),
        });
      }
    }

    return payouts;
  }
}
