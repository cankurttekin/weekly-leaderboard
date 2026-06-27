import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RankingService, getCurrentWeekId } from './services/ranking.service';
import { PrizeService } from './services/prize.service';
import { EarningRequestDto } from './dto/earning-request.dto';
import { LeaderboardTopResponseDto, OwnRankResponseDto, GlobalStatsDto, PlayerProfileDto } from './dto/leaderboard-response.dto';
import { PrizePoolResponseDto } from './dto/prize-pool.dto';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(
    private readonly rankingService: RankingService,
    private readonly prizeService: PrizeService,
  ) {}

  @Post('earnings')
  async recordEarning(@Body() dto: EarningRequestDto): Promise<{ weekId: number; totalEarnings: number; currentRank: number }> {
    return this.rankingService.recordEarning(dto.playerId, dto.amount);
  }

  @Get('top')
  async getTop(
    @Query('weekId') weekId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('region') region?: string,
    @Query('sortBy') sortBy?: string,
  ): Promise<LeaderboardTopResponseDto> {
    return this.rankingService.getTop(
      weekId ? parseInt(weekId, 10) : undefined,
      limit ? Math.min(parseInt(limit, 10), 200) : 100,
      offset ? parseInt(offset, 10) : 0,
      region,
      sortBy,
    );
  }

  @Get('player/:playerId')
  async getOwnRank(
    @Param('playerId') playerId: string,
    @Query('weekId') weekId?: string,
  ): Promise<OwnRankResponseDto> {
    return this.rankingService.getOwnRank(playerId, weekId ? parseInt(weekId, 10) : undefined);
  }

  @Get('player/:playerId/profile')
  async getPlayerProfile(
    @Param('playerId') playerId: string,
    @Query('weekId') weekId?: string,
  ): Promise<PlayerProfileDto> {
    return this.rankingService.getPlayerProfile(playerId, weekId ? parseInt(weekId, 10) : undefined);
  }

  @Get('search')
  async searchPlayers(@Query('q') query: string, @Query('limit') limit?: string) {
    return this.rankingService.searchPlayers(query, limit ? parseInt(limit, 10) : 10);
  }

  @Get('stats')
  async getStats(@Query('weekId') weekId?: string): Promise<GlobalStatsDto> {
    return this.rankingService.getGlobalStats(weekId ? parseInt(weekId, 10) : undefined);
  }

  @Get('pool')
  async getPool(@Query('weekId') weekId?: string): Promise<PrizePoolResponseDto> {
    return this.prizeService.getPoolInfo(weekId ? parseInt(weekId, 10) : undefined);
  }

  @Get('countdown')
  async getCountdown(): Promise<{ weekId: number; resetAt: string; countdownMs: number; currentPeriod: string }> {
    const resetAt = new Date();
    const dayOfWeek = resetAt.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    resetAt.setDate(resetAt.getDate() + daysUntilMonday);
    resetAt.setUTCHours(0, 0, 0, 0);

    return {
      weekId: getCurrentWeekId(),
      resetAt: resetAt.toISOString(),
      countdownMs: Math.max(0, resetAt.getTime() - Date.now()),
      currentPeriod: 'active',
    };
  }
}
