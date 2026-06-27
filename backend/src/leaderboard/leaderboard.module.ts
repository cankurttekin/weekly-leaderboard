import { Module } from '@nestjs/common';
import { LeaderboardController } from './leaderboard.controller';
import { RankingService } from './services/ranking.service';
import { PrizeService } from './services/prize.service';
import { WeeklyResetService } from './services/weekly-reset.service';

@Module({
  controllers: [LeaderboardController],
  providers: [RankingService, PrizeService, WeeklyResetService],
  exports: [RankingService, PrizeService],
})
export class LeaderboardModule {}
