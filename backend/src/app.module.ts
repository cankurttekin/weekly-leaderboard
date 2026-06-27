import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './health/health.module';
import { ProvidersModule } from './providers/providers.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: (config: Record<string, unknown>) => {
        const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'REDIS_HOST', 'REDIS_PORT', 'MONGO_URI'];
        const missing = required.filter((key) => !config[key]);
        if (missing.length > 0) {
          throw new Error(`Missing required env vars: ${missing.join(', ')}`);
        }
        return config;
      },
    }),
    ScheduleModule.forRoot(),
    HealthModule,
    ProvidersModule,
    LeaderboardModule,
  ],
})
export class AppModule {}
