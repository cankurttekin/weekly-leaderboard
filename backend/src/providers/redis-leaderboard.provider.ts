import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { DatabaseProvider, LeaderboardEntry } from './database.abstract';

@Injectable()
export class RedisLeaderboardProvider extends DatabaseProvider {
  readonly name = 'redis-leaderboard';
  readonly type = 'redis' as const;
  private readonly redis: Redis;
  private readonly logger = new Logger(RedisLeaderboardProvider.name);

  constructor(configService: ConfigService) {
    super();
    this.redis = new Redis({
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: configService.get<number>('REDIS_PORT', 6379),
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });
  }

  private leaderboardKey(weekId: number): string {
    return `leaderboard:weekly:${weekId}`;
  }

  private poolKey(weekId: number): string {
    return `leaderboard:pool:${weekId}`;
  }

  private totalEarningsKey(weekId: number): string {
    return `leaderboard:total-earnings:${weekId}`;
  }

  async addEarning(playerId: string, weekId: number, amount: number): Promise<{ totalEarnings: number; currentRank: number }> {
    const key = this.leaderboardKey(weekId);
    const poolKey = this.poolKey(weekId);
    const totalKey = this.totalEarningsKey(weekId);

    const results = await Promise.all([
      this.redis.zincrby(key, amount, playerId),
      this.redis.incrby(poolKey, Math.floor(amount * 0.02)),
      this.redis.incrby(totalKey, amount),
    ]);

    const totalEarnings = parseInt(results[0], 10);
    const rank = await this.redis.zrevrank(key, playerId);
    return { totalEarnings, currentRank: rank !== null ? rank + 1 : 0 };
  }

  async getTopPlayers(weekId: number, limit: number = 100, offset: number = 0): Promise<LeaderboardEntry[]> {
    const key = this.leaderboardKey(weekId);
    const start = offset;
    const end = offset + limit - 1;
    const results = await this.redis.zrevrange(key, start, end, 'WITHSCORES');
    return this.parseRedisResults(results);
  }

  async getPlayerRank(weekId: number, playerId: string): Promise<{ rank: number; totalPlayers: number; earnings: number } | null> {
    const key = this.leaderboardKey(weekId);
    const [rank, totalPlayers, earnings] = await Promise.all([
      this.redis.zrevrank(key, playerId),
      this.redis.zcard(key),
      this.redis.zscore(key, playerId),
    ]);
    if (rank === null || earnings === null) return null;
    return { rank: rank + 1, totalPlayers, earnings: Math.floor(Number(earnings)) };
  }

  async getPlayerNeighbours(weekId: number, playerId: string, above: number = 3, below: number = 2): Promise<{ above: LeaderboardEntry[]; below: LeaderboardEntry[] }> {
    const key = this.leaderboardKey(weekId);
    const rank = await this.redis.zrevrank(key, playerId);
    if (rank === null) {
      return { above: [], below: [] };
    }

    const aboveStart = Math.max(0, rank - above);
    const aboveCount = rank - aboveStart;
    const belowStart = rank + 1;

    const [aboveResults, belowResults] = await Promise.all([
      this.redis.zrevrange(key, aboveStart, aboveStart + aboveCount - 1, 'WITHSCORES'),
      this.redis.zrevrange(key, belowStart, belowStart + below - 1, 'WITHSCORES'),
    ]);

    return {
      above: this.parseRedisResults(aboveResults),
      below: this.parseRedisResults(belowResults),
    };
  }

  async getPoolAmount(weekId: number): Promise<number> {
    const val = await this.redis.get(this.poolKey(weekId));
    return val ? parseInt(val, 10) : 0;
  }

  async getTotalEarnings(weekId: number): Promise<number> {
    const val = await this.redis.get(this.totalEarningsKey(weekId));
    return val ? parseInt(val, 10) : 0;
  }

  async getTotalPlayerCount(weekId: number): Promise<number> {
    const key = this.leaderboardKey(weekId);
    return this.redis.zcard(key);
  }

  async deleteWeekData(weekId: number): Promise<void> {
    const keys = [this.leaderboardKey(weekId), this.poolKey(weekId), this.totalEarningsKey(weekId)];
    await this.redis.del(...keys);
  }

  private parseRedisResults(results: string[]): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = [];
    for (let i = 0; i < results.length; i += 2) {
      entries.push({
        rank: 0,
        playerId: results[i],
        username: '',
        earnings: Math.floor(parseFloat(results[i + 1])),
        region: '',
        level: 0,
      });
    }
    return entries;
  }
}
