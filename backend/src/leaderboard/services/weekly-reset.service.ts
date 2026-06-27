import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProviderFactory } from '../../providers/provider-factory';
import { RedisLeaderboardProvider } from '../../providers/redis-leaderboard.provider';
import { PostgresEarningsProvider } from '../../providers/postgres-earnings.provider';
import { MongoArchiveProvider } from '../../providers/mongo-archive.provider';
import { PrizeService } from './prize.service';
import { getCurrentWeekId } from './ranking.service';
import { PayoutRecord, WeeklySnapshot } from '../../providers/database.abstract';

@Injectable()
export class WeeklyResetService {
  private readonly logger = new Logger(WeeklyResetService.name);
  private readonly redis: RedisLeaderboardProvider;
  private readonly postgres: PostgresEarningsProvider;
  private readonly mongo: MongoArchiveProvider;

  constructor(
    providerFactory: ProviderFactory,
    private readonly prizeService: PrizeService,
  ) {
    this.redis = providerFactory.getRedisProvider();
    this.postgres = providerFactory.getPostgresProvider();
    this.mongo = providerFactory.getMongoProvider();
  }

  @Cron(CronExpression.EVERY_WEEK)
  async executeWeeklyReset(): Promise<void> {
    const weekId = getCurrentWeekId();
    this.logger.log(`Starting weekly reset for week ${weekId}`);

    try {
      const topEntries = await this.redis.getTopPlayers(weekId, 100);
      if (topEntries.length === 0) {
        this.logger.log(`No entries for week ${weekId}, skipping reset`);
        return;
      }

      const usernames = await this.postgres.getUsernames(topEntries.map((e) => e.playerId));
      const poolAmount = await this.redis.getPoolAmount(weekId);
      const totalEarnings = await this.redis.getTotalEarnings(weekId);

      const rankedEntries = topEntries.map((e, i) => ({
        rank: i + 1,
        playerId: e.playerId,
        username: usernames.get(e.playerId) ?? 'Unknown',
        earnings: e.earnings,
      }));

      const payouts = this.prizeService.computePayouts(rankedEntries, poolAmount);

      await this.postgres.createPool(weekId, totalEarnings, poolAmount);
      await this.postgres.distributePayouts(weekId, payouts);

      const snapshot: WeeklySnapshot = {
        weekId,
        generatedAt: new Date(),
        pool: { totalEarnings, poolAmount },
        top100: payouts,
        totalPlayers: topEntries.length,
      };
      await this.mongo.saveWeeklySnapshot(weekId, snapshot);

      await this.redis.deleteWeekData(weekId);

      this.logger.log(`Weekly reset complete for week ${weekId}. Distributed ${poolAmount} to ${payouts.length} players.`);
    } catch (err) {
      this.logger.error(`Weekly reset failed for week ${weekId}`, (err as Error).stack);
    }
  }
}
