import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProviderFactory } from '../../providers/provider-factory';
import { RedisLeaderboardProvider } from '../../providers/redis-leaderboard.provider';
import { PostgresEarningsProvider } from '../../providers/postgres-earnings.provider';
import { LeaderboardEntryDto, LeaderboardTopResponseDto, OwnRankResponseDto, GlobalStatsDto, PlayerProfileDto } from '../dto/leaderboard-response.dto';

export function getCurrentWeekId(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  return now.getFullYear() * 100 + Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

export function getMondayReset(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const reset = new Date(now);
  reset.setDate(now.getDate() + daysUntilMonday);
  reset.setUTCHours(0, 0, 0, 0);
  return reset;
}

@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name);
  private readonly redis: RedisLeaderboardProvider;
  private readonly postgres: PostgresEarningsProvider;

  constructor(providerFactory: ProviderFactory) {
    this.redis = providerFactory.getRedisProvider();
    this.postgres = providerFactory.getPostgresProvider();
  }

  async recordEarning(playerId: string, amount: number): Promise<{ weekId: number; totalEarnings: number; currentRank: number }> {
    const weekId = getCurrentWeekId();
    const [redisResult] = await Promise.all([
      this.redis.addEarning(playerId, weekId, amount),
      this.postgres.upsertEarning(playerId, weekId, amount),
    ]);
    return { weekId, ...redisResult };
  }

  async getTop(
    weekId?: number,
    limit: number = 100,
    offset: number = 0,
    region?: string,
    sortBy?: string,
  ): Promise<LeaderboardTopResponseDto> {
    const wId = weekId ?? getCurrentWeekId();

    let entries: LeaderboardEntryDto[];

    if (region) {
      entries = await this.getTopByRegion(wId, limit, offset, region);
    } else {
      const rawEntries = await this.redis.getTopPlayers(wId, limit, offset);
      const playerIds = rawEntries.map((e) => e.playerId);
      const profiles = await this.postgres.getPlayerProfiles(playerIds);

      entries = rawEntries.map((e, i) => ({
        rank: offset + i + 1,
        playerId: e.playerId,
        username: profiles.get(e.playerId)?.username ?? 'Unknown',
        earnings: e.earnings,
        region: profiles.get(e.playerId)?.region ?? 'NA',
        level: profiles.get(e.playerId)?.level ?? 1,
      }));
    }

    const totalPlayers = await this.redis.getTotalPlayerCount(wId);

    return {
      weekId: wId,
      entries,
      totalPlayers,
      generatedAt: new Date().toISOString(),
    };
  }

  private async getTopByRegion(weekId: number, limit: number, offset: number, region: string): Promise<LeaderboardEntryDto[]> {
    // Fetch extra from Redis since filtering by region will reduce the set
    const fetchLimit = Math.max(limit + offset, 500);
    const rawEntries = await this.redis.getTopPlayers(weekId, fetchLimit, 0);
    const playerIds = rawEntries.map((e) => e.playerId);
    const profiles = await this.postgres.getPlayerProfiles(playerIds);

    const all = rawEntries.map((e, i) => ({
      rank: i + 1,
      playerId: e.playerId,
      username: profiles.get(e.playerId)?.username ?? 'Unknown',
      earnings: e.earnings,
      region: profiles.get(e.playerId)?.region ?? 'NA',
      level: profiles.get(e.playerId)?.level ?? 1,
    }));

    const filtered = all.filter((e) => e.region === region);
    return filtered.slice(offset, offset + limit).map((e, i) => ({
      ...e,
      rank: offset + i + 1,
    }));
  }

  async getOwnRank(playerId: string, weekId?: number): Promise<OwnRankResponseDto> {
    const wId = weekId ?? getCurrentWeekId();
    const rankInfo = await this.redis.getPlayerRank(wId, playerId);
    if (!rankInfo) {
      throw new NotFoundException(`Player ${playerId} not found in week ${wId}`);
    }

    let above: LeaderboardEntryDto[];
    let below: LeaderboardEntryDto[];

    if (rankInfo.rank <= 100) {
      const top = await this.redis.getTopPlayers(wId, 100);
      const playerIds = top.map((e) => e.playerId);
      const profiles = await this.postgres.getPlayerProfiles(playerIds);
      above = [];
      below = [];
      for (const [i, entry] of top.entries()) {
        const profile = profiles.get(entry.playerId);
        const dto: LeaderboardEntryDto = {
          rank: i + 1,
          playerId: entry.playerId,
          username: profile?.username ?? 'Unknown',
          earnings: entry.earnings,
          region: profile?.region ?? 'NA',
          level: profile?.level ?? 1,
        };
        if (i + 1 < rankInfo.rank) {
          above.push(dto);
        } else if (i + 1 > rankInfo.rank) {
          below.push(dto);
        }
      }
    } else {
      const neighbours = await this.redis.getPlayerNeighbours(wId, playerId, 3, 2);
      const allIds = [...neighbours.above.map((e) => e.playerId), playerId, ...neighbours.below.map((e) => e.playerId)];
      const profiles = await this.postgres.getPlayerProfiles(allIds);

      above = neighbours.above.map((e) => {
        const profile = profiles.get(e.playerId);
        return {
          rank: rankInfo.rank - (neighbours.above.length - neighbours.above.indexOf(e)),
          playerId: e.playerId,
          username: profile?.username ?? 'Unknown',
          earnings: e.earnings,
          region: profile?.region ?? 'NA',
          level: profile?.level ?? 1,
        };
      });
      below = neighbours.below.map((e) => {
        const profile = profiles.get(e.playerId);
        return {
          rank: rankInfo.rank + neighbours.below.indexOf(e) + 1,
          playerId: e.playerId,
          username: profile?.username ?? 'Unknown',
          earnings: e.earnings,
          region: profile?.region ?? 'NA',
          level: profile?.level ?? 1,
        };
      });
    }

    const ownProfile = (await this.postgres.getPlayerProfiles([playerId])).get(playerId);

    return {
      rank: rankInfo.rank,
      totalPlayers: rankInfo.totalPlayers,
      earnings: rankInfo.earnings,
      username: ownProfile?.username ?? 'Unknown',
      region: ownProfile?.region ?? 'NA',
      level: ownProfile?.level ?? 1,
      above,
      below,
    };
  }

  async getPlayerProfile(playerId: string, weekId?: number): Promise<PlayerProfileDto> {
    const wId = weekId ?? getCurrentWeekId();
    const rankInfo = await this.redis.getPlayerRank(wId, playerId);
    if (!rankInfo) {
      throw new NotFoundException(`Player ${playerId} not found in week ${wId}`);
    }
    const profile = (await this.postgres.getPlayerProfiles([playerId])).get(playerId);

    return {
      playerId,
      username: profile?.username ?? 'Unknown',
      region: profile?.region ?? 'NA',
      level: profile?.level ?? 1,
      rank: rankInfo.rank,
      totalPlayers: rankInfo.totalPlayers,
      earnings: rankInfo.earnings,
    };
  }

  async getGlobalStats(weekId?: number): Promise<GlobalStatsDto> {
    const wId = weekId ?? getCurrentWeekId();

    const [totalPlayers, totalEarnings, poolAmount, regionBreakdown, topPlayerRaw] = await Promise.all([
      this.redis.getTotalPlayerCount(wId),
      this.redis.getTotalEarnings(wId),
      this.redis.getPoolAmount(wId),
      this.postgres.getRegionBreakdown(wId),
      this.redis.getTopPlayers(wId, 1, 0),
    ]);

    let topEarner: { playerId: string; username: string; earnings: number } | null = null;
    if (topPlayerRaw.length > 0) {
      const profiles = await this.postgres.getPlayerProfiles([topPlayerRaw[0].playerId]);
      const profile = profiles.get(topPlayerRaw[0].playerId);
      topEarner = {
        playerId: topPlayerRaw[0].playerId,
        username: profile?.username ?? 'Unknown',
        earnings: topPlayerRaw[0].earnings,
      };
    }

    return {
      totalPlayers,
      totalEarnings,
      poolAmount,
      topEarner,
      regionBreakdown,
    };
  }

  async searchPlayers(query: string, limit: number = 10): Promise<{ playerId: string; username: string; currentRank: number; earnings: number; region: string; level: number }[]> {
    const results = await this.postgres.searchPlayers(query, limit);
    const weekId = getCurrentWeekId();

    const enriched = await Promise.all(
      results.map(async (r) => {
        const rankInfo = await this.redis.getPlayerRank(weekId, r.playerId);
        return {
          playerId: r.playerId,
          username: r.username,
          currentRank: rankInfo?.rank ?? 0,
          earnings: rankInfo?.earnings ?? 0,
          region: r.region,
          level: r.level,
        };
      }),
    );

    return enriched;
  }

  private async getTotalPlayerCount(weekId: number): Promise<number> {
    return this.redis.getTotalPlayerCount(weekId);
  }
}
