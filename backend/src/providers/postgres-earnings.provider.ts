import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient } from 'pg';
import { DatabaseProvider, LeaderboardEntry, PayoutRecord, PlayerSearchResult } from './database.abstract';

@Injectable()
export class PostgresEarningsProvider extends DatabaseProvider {
  readonly name = 'postgres-earnings';
  readonly type = 'postgres' as const;
  private readonly pool: Pool;
  private readonly logger = new Logger(PostgresEarningsProvider.name);

  constructor(configService: ConfigService) {
    super();
    this.pool = new Pool({
      host: configService.get<string>('DB_HOST', 'localhost'),
      port: configService.get<number>('DB_PORT', 5432),
      database: configService.get<string>('DB_NAME', 'leaderboard'),
      user: configService.get<string>('DB_USER', 'leaderboard'),
      password: configService.get<string>('DB_PASSWORD', 'leaderboard_dev'),
    });
  }

  async upsertEarning(playerId: string, weekId: number, amount: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO weekly_earnings (player_id, week_id, earnings, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (player_id, week_id)
       DO UPDATE SET earnings = weekly_earnings.earnings + $3, updated_at = NOW()`,
      [playerId, weekId, amount],
    );
  }

  async getPlayerProfiles(playerIds: string[]): Promise<Map<string, { username: string; region: string; level: number }>> {
    if (playerIds.length === 0) return new Map();
    const result = await this.pool.query(
      'SELECT id, username, region, level FROM players WHERE id = ANY($1::uuid[])',
      [playerIds],
    );
    const map = new Map<string, { username: string; region: string; level: number }>();
    for (const row of result.rows) {
      map.set(row.id, { username: row.username, region: row.region, level: row.level });
    }
    return map;
  }

  async getUsernames(playerIds: string[]): Promise<Map<string, string>> {
    if (playerIds.length === 0) return new Map();
    const result = await this.pool.query(
      'SELECT id, username FROM players WHERE id = ANY($1::uuid[])',
      [playerIds],
    );
    const map = new Map<string, string>();
    for (const row of result.rows) {
      map.set(row.id, row.username);
    }
    return map;
  }

  async searchPlayers(query: string, limit: number = 10): Promise<PlayerSearchResult[]> {
    const result = await this.pool.query(
      `SELECT p.id, p.username, p.region, p.level
       FROM players p
       WHERE p.username ILIKE $1
       LIMIT $2`,
      [`%${query}%`, limit],
    );

    return result.rows.map((row: { id: string; username: string; region: string; level: number }) => ({
      playerId: row.id,
      username: row.username,
      currentRank: 0,
      earnings: 0,
      region: row.region,
      level: row.level,
    }));
  }

  async getTopPlayers(weekId: number, limit: number = 100): Promise<LeaderboardEntry[]> {
    const result = await this.pool.query(
      `SELECT we.player_id AS "playerId", p.username, p.region, p.level, we.earnings
       FROM weekly_earnings we
       JOIN players p ON p.id = we.player_id
       WHERE we.week_id = $1
       ORDER BY we.earnings DESC
       LIMIT $2`,
      [weekId, limit],
    );

    return result.rows.map((row: { playerId: string; username: string; region: string; level: number; earnings: number }, index: number) => ({
      rank: index + 1,
      playerId: row.playerId,
      username: row.username,
      earnings: row.earnings,
      region: row.region,
      level: row.level,
    }));
  }

  async getTotalEarnings(weekId: number): Promise<number> {
    const result = await this.pool.query(
      'SELECT COALESCE(SUM(earnings), 0) AS total FROM weekly_earnings WHERE week_id = $1',
      [weekId],
    );
    return parseInt(result.rows[0].total, 10);
  }

  async getRegionBreakdown(weekId: number): Promise<{ region: string; count: number; totalEarnings: number }[]> {
    const result = await this.pool.query(
      `SELECT p.region, COUNT(*)::int AS count, COALESCE(SUM(we.earnings), 0)::bigint AS total_earnings
       FROM weekly_earnings we
       JOIN players p ON p.id = we.player_id
       WHERE we.week_id = $1
       GROUP BY p.region
       ORDER BY total_earnings DESC`,
      [weekId],
    );
    return result.rows.map((r: { region: string; count: number; total_earnings: string }) => ({
      region: r.region,
      count: r.count,
      totalEarnings: parseInt(r.total_earnings, 10),
    }));
  }

  async getRegionPlayerIds(weekId: number, region: string): Promise<Set<string>> {
    const result = await this.pool.query(
      `SELECT we.player_id FROM weekly_earnings we
       JOIN players p ON p.id = we.player_id
       WHERE we.week_id = $1 AND p.region = $2`,
      [weekId, region],
    );
    return new Set(result.rows.map((r: { player_id: string }) => r.player_id));
  }

  async createPool(weekId: number, totalEarnings: number, poolAmount: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO weekly_pools (week_id, total_earnings, pool_amount)
       VALUES ($1, $2, $3)
       ON CONFLICT (week_id) DO UPDATE
       SET total_earnings = $2, pool_amount = $3`,
      [weekId, totalEarnings, poolAmount],
    );
  }

  async getPoolAmount(weekId: number): Promise<number> {
    const result = await this.pool.query(
      'SELECT pool_amount FROM weekly_pools WHERE week_id = $1',
      [weekId],
    );
    return result.rows.length > 0 ? parseInt(result.rows[0].pool_amount, 10) : 0;
  }

  async distributePayouts(weekId: number, payouts: PayoutRecord[]): Promise<void> {
    const client: PoolClient = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const payout of payouts) {
        await client.query(
          `INSERT INTO payouts (week_id, player_id, rank, earnings, share_pct, prize_amount)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [weekId, payout.playerId, payout.rank, payout.earnings, payout.sharePct, payout.prizeAmount],
        );
      }

      await client.query(
        `UPDATE weekly_pools SET distributed = TRUE, distributed_at = NOW() WHERE week_id = $1`,
        [weekId],
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      this.logger.error(`Payout distribution failed for week ${weekId}`, (err as Error).stack);
      throw err;
    } finally {
      client.release();
    }
  }
}
