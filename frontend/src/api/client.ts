import type { LeaderboardTopResponse, OwnRankResponse, PrizePoolInfo, CountdownInfo, PlayerSearchResult, GlobalStats, PlayerProfile } from '../types/leaderboard';

const BASE = '/api';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export function getTopLeaderboard(
  weekId?: number,
  limit = 100,
  offset = 0,
  region?: string,
  sortBy?: string,
): Promise<LeaderboardTopResponse> {
  const params = new URLSearchParams();
  if (weekId) params.set('weekId', String(weekId));
  if (limit !== 100) params.set('limit', String(limit));
  if (offset > 0) params.set('offset', String(offset));
  if (region) params.set('region', region);
  if (sortBy) params.set('sortBy', sortBy);
  const qs = params.toString();
  return fetchJson(`${BASE}/leaderboard/top${qs ? `?${qs}` : ''}`);
}

export function getOwnRank(playerId: string, weekId?: number): Promise<OwnRankResponse> {
  const params = new URLSearchParams();
  if (weekId) params.set('weekId', String(weekId));
  const qs = params.toString();
  return fetchJson(`${BASE}/leaderboard/player/${playerId}${qs ? `?${qs}` : ''}`);
}

export function getPlayerProfile(playerId: string, weekId?: number): Promise<PlayerProfile> {
  const params = new URLSearchParams();
  if (weekId) params.set('weekId', String(weekId));
  const qs = params.toString();
  return fetchJson(`${BASE}/leaderboard/player/${playerId}/profile${qs ? `?${qs}` : ''}`);
}

export function searchPlayers(query: string, limit = 10): Promise<PlayerSearchResult[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  return fetchJson(`${BASE}/leaderboard/search?${params}`);
}

export function getPoolInfo(weekId?: number): Promise<PrizePoolInfo> {
  const params = new URLSearchParams();
  if (weekId) params.set('weekId', String(weekId));
  const qs = params.toString();
  return fetchJson(`${BASE}/leaderboard/pool${qs ? `?${qs}` : ''}`);
}

export function getGlobalStats(weekId?: number): Promise<GlobalStats> {
  const params = new URLSearchParams();
  if (weekId) params.set('weekId', String(weekId));
  const qs = params.toString();
  return fetchJson(`${BASE}/leaderboard/stats${qs ? `?${qs}` : ''}`);
}

export function getCountdown(): Promise<CountdownInfo> {
  return fetchJson(`${BASE}/leaderboard/countdown`);
}
