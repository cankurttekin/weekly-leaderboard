import { Global, Module } from '@nestjs/common';
import { RedisLeaderboardProvider } from './redis-leaderboard.provider';
import { PostgresEarningsProvider } from './postgres-earnings.provider';
import { MongoArchiveProvider } from './mongo-archive.provider';
import { ProviderFactory } from './provider-factory';

@Global()
@Module({
  providers: [
    RedisLeaderboardProvider,
    PostgresEarningsProvider,
    MongoArchiveProvider,
    ProviderFactory,
  ],
  exports: [
    RedisLeaderboardProvider,
    PostgresEarningsProvider,
    MongoArchiveProvider,
    ProviderFactory,
  ],
})
export class ProvidersModule {}
