export class LeaderboardEntryDto {
  rank!: number;
  playerId!: string;
  username!: string;
  earnings!: number;
  region!: string;
  level!: number;
  prize?: number;
}

export class LeaderboardTopResponseDto {
  weekId!: number;
  entries!: LeaderboardEntryDto[];
  totalPlayers!: number;
  generatedAt!: string;
}

export class OwnRankResponseDto {
  rank!: number;
  totalPlayers!: number;
  earnings!: number;
  username!: string;
  region!: string;
  level!: number;
  above!: LeaderboardEntryDto[];
  below!: LeaderboardEntryDto[];
}

export class PlayerSearchResponseDto {
  playerId!: string;
  username!: string;
  currentRank!: number;
  earnings!: number;
  region!: string;
  level!: number;
}

export class GlobalStatsDto {
  totalPlayers!: number;
  totalEarnings!: number;
  poolAmount!: number;
  topEarner!: { playerId: string; username: string; earnings: number } | null;
  regionBreakdown!: { region: string; count: number; totalEarnings: number }[];
}

export class PlayerProfileDto {
  playerId!: string;
  username!: string;
  region!: string;
  level!: number;
  rank!: number;
  totalPlayers!: number;
  earnings!: number;
}
