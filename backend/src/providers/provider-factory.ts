import { Injectable } from '@nestjs/common';
import { DatabaseProvider } from './database.abstract';
import { RedisLeaderboardProvider } from './redis-leaderboard.provider';
import { PostgresEarningsProvider } from './postgres-earnings.provider';
import { MongoArchiveProvider } from './mongo-archive.provider';

@Injectable()
export class ProviderFactory {
  private readonly providers: Map<string, DatabaseProvider>;

  constructor(
    private readonly redisProvider: RedisLeaderboardProvider,
    private readonly postgresProvider: PostgresEarningsProvider,
    private readonly mongoProvider: MongoArchiveProvider,
  ) {
    this.providers = new Map<string, DatabaseProvider>([
      [redisProvider.name, redisProvider],
      [postgresProvider.name, postgresProvider],
      [mongoProvider.name, mongoProvider],
    ]);
  }

  getProvider(name: string): DatabaseProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Unknown provider: ${name}. Available: ${[...this.providers.keys()].join(', ')}`);
    }
    return provider;
  }

  getRedisProvider(): RedisLeaderboardProvider {
    return this.redisProvider;
  }

  getPostgresProvider(): PostgresEarningsProvider {
    return this.postgresProvider;
  }

  getMongoProvider(): MongoArchiveProvider {
    return this.mongoProvider;
  }
}
