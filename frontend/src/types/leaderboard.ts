export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  earnings: number;
  region: string;
  level: number;
  prize?: number;
}

export interface LeaderboardTopResponse {
  weekId: number;
  entries: LeaderboardEntry[];
  totalPlayers: number;
  generatedAt: string;
}

export interface OwnRankResponse {
  rank: number;
  totalPlayers: number;
  earnings: number;
  username: string;
  region: string;
  level: number;
  above: LeaderboardEntry[];
  below: LeaderboardEntry[];
}

export interface PrizePoolInfo {
  weekId: number;
  totalEarnings: number;
  poolAmount: number;
  sharePercent: number;
  resetAt: string;
  countdownMs: number;
}

export interface CountdownInfo {
  weekId: number;
  resetAt: string;
  countdownMs: number;
  currentPeriod: string;
}

export interface PlayerSearchResult {
  playerId: string;
  username: string;
  currentRank: number;
  earnings: number;
  region: string;
  level: number;
}

export interface GlobalStats {
  totalPlayers: number;
  totalEarnings: number;
  poolAmount: number;
  topEarner: { playerId: string; username: string; earnings: number } | null;
  regionBreakdown: { region: string; count: number; totalEarnings: number }[];
}

export interface PlayerProfile {
  playerId: string;
  username: string;
  region: string;
  level: number;
  rank: number;
  totalPlayers: number;
  earnings: number;
}

export type ViewMode = 'top100' | 'ownRank' | 'search';

export const PRIZE_SHARES = {
  1: 0.20,
  2: 0.15,
  3: 0.10,
  RANGE_4_100: 0.55,
} as const;

export const RANK_BADGE_VARIANTS = {
  top1:    { label: '1st', color: '#ffd700', className: 'gold' },
  top2:    { label: '2nd', color: '#c0c0c0', className: 'silver' },
  top3:    { label: '3rd', color: '#cd7f32', className: 'bronze' },
  normal:  { label: '#',   color: '#64748b', className: 'default' },
} as const;

export const PRIZE_POOL_SHARE_TEXT = '2% of ALL weekly earnings goes to the prize pool.';

export const REGIONS = ['NA', 'EU', 'ASIA', 'SA', 'OC'] as const;
export type Region = (typeof REGIONS)[number];
