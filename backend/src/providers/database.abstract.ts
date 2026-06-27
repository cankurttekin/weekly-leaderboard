export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  earnings: number;
  region: string;
  level: number;
}

export interface PlayerSearchResult {
  playerId: string;
  username: string;
  currentRank: number;
  earnings: number;
  region: string;
  level: number;
}

export interface PayoutRecord {
  rank: number;
  playerId: string;
  username: string;
  earnings: number;
  sharePct: number;
  prizeAmount: number;
}

export interface WeeklySnapshot {
  weekId: number;
  generatedAt: Date;
  pool: {
    totalEarnings: number;
    poolAmount: number;
  };
  top100: PayoutRecord[];
  totalPlayers: number;
}

export abstract class DatabaseProvider {
  abstract readonly name: string;
  abstract readonly type: 'redis' | 'postgres' | 'mongo';

  addEarning(playerId: string, weekId: number, amount: number): Promise<{ totalEarnings: number; currentRank: number }> {
    throw new Error(`${this.name} does not implement addEarning`);
  }

  getTopPlayers(weekId: number, limit: number): Promise<LeaderboardEntry[]> {
    throw new Error(`${this.name} does not implement getTopPlayers`);
  }

  getPlayerRank(weekId: number, playerId: string): Promise<{ rank: number; totalPlayers: number; earnings: number } | null> {
    throw new Error(`${this.name} does not implement getPlayerRank`);
  }

  getPlayerNeighbours(weekId: number, playerId: string, above: number, below: number): Promise<{ above: LeaderboardEntry[]; below: LeaderboardEntry[] }> {
    throw new Error(`${this.name} does not implement getPlayerNeighbours`);
  }

  upsertEarning(playerId: string, weekId: number, amount: number): Promise<void> {
    throw new Error(`${this.name} does not implement upsertEarning`);
  }

  getTotalEarnings(weekId: number): Promise<number> {
    throw new Error(`${this.name} does not implement getTotalEarnings`);
  }

  getPoolAmount(weekId: number): Promise<number> {
    throw new Error(`${this.name} does not implement getPoolAmount`);
  }

  createPool(weekId: number, totalEarnings: number, poolAmount: number): Promise<void> {
    throw new Error(`${this.name} does not implement createPool`);
  }

  distributePayouts(weekId: number, payouts: PayoutRecord[]): Promise<void> {
    throw new Error(`${this.name} does not implement distributePayouts`);
  }

  searchPlayers(query: string, limit: number): Promise<PlayerSearchResult[]> {
    throw new Error(`${this.name} does not implement searchPlayers`);
  }

  saveWeeklySnapshot(weekId: number, data: WeeklySnapshot): Promise<void> {
    throw new Error(`${this.name} does not implement saveWeeklySnapshot`);
  }

  getWeeklySnapshot(weekId: number): Promise<WeeklySnapshot | null> {
    throw new Error(`${this.name} does not implement getWeeklySnapshot`);
  }
}
