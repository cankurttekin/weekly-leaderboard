import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, Db, Collection } from 'mongodb';
import { DatabaseProvider, WeeklySnapshot } from './database.abstract';

@Injectable()
export class MongoArchiveProvider extends DatabaseProvider {
  readonly name = 'mongo-archive';
  readonly type = 'mongo' as const;
  private readonly client: MongoClient;
  private readonly logger = new Logger(MongoArchiveProvider.name);

  constructor(configService: ConfigService) {
    super();
    const uri = configService.get<string>('MONGO_URI', 'mongodb://localhost:27017/leaderboard_archive');
    this.client = new MongoClient(uri);
  }

  private get db(): Db {
    return this.client.db();
  }

  private get snapshots(): Collection<WeeklySnapshot> {
    return this.db.collection<WeeklySnapshot>('weekly_snapshots');
  }

  async saveWeeklySnapshot(weekId: number, data: WeeklySnapshot): Promise<void> {
    await this.snapshots.updateOne(
      { weekId },
      { $set: data },
      { upsert: true },
    );
    this.logger.log(`Saved weekly snapshot for week ${weekId}`);
  }

  async getWeeklySnapshot(weekId: number): Promise<WeeklySnapshot | null> {
    return this.snapshots.findOne({ weekId });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }
}
