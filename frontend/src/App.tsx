import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { LeaderboardEntry, PrizePoolInfo, OwnRankResponse, PlayerSearchResult, GlobalStats, PlayerProfile } from './types/leaderboard';
import { getTopLeaderboard, getPoolInfo, getOwnRank, getGlobalStats, getPlayerProfile } from './api/client';
import { strings } from './i18n/strings';
import { LeaderboardRow } from './components/LeaderboardRow';
import { OwnRankCluster } from './components/OwnRankCluster';
import { PrizePoolCard } from './components/PrizePoolCard';
import { PlayerSearch } from './components/PlayerSearch';
import { RegionFilter } from './components/RegionFilter';
import { GlobalStatsBar } from './components/GlobalStatsBar';
import { PlayerDetailModal } from './components/PlayerDetailModal';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { ErrorBanner } from './components/ErrorBanner';
import { EmptyState } from './components/EmptyState';
import { Footer } from './components/Footer';
import styles from './App.module.css';

const PAGE_SIZE = 100;
const DEMO_OFFSET = 5000;

function App(): React.ReactNode {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [pool, setPool] = useState<PrizePoolInfo | null>(null);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [currentPlayerRank, setCurrentPlayerRank] = useState<OwnRankResponse | null>(null);
  const [searchHighlightId, setSearchHighlightId] = useState<string | null>(null);
  const [region, setRegion] = useState('');
  const [detailPlayer, setDetailPlayer] = useState<PlayerProfile | null>(null);
  const [pageInput, setPageInput] = useState('');
  const pageInputRef = useRef<HTMLInputElement>(null);

  const fetchPage = useCallback(async (pageNum: number, regionFilter?: string) => {
    setLoading(true);
    setError(null);
    try {
      const offset = pageNum * PAGE_SIZE;
      const [topData, poolData, statsData] = await Promise.all([
        getTopLeaderboard(undefined, PAGE_SIZE, offset, regionFilter || undefined),
        getPoolInfo(),
        getGlobalStats(),
      ]);
      setEntries(topData.entries);
      setTotalPlayers(topData.totalPlayers);
      setPool(poolData);
      setStats(statsData);
    } catch (err) {
      setError((err as Error).message || strings.error.failedLoad);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDemoPlayer = useCallback(async () => {
    try {
      const demoEntry = await getTopLeaderboard(undefined, 1, DEMO_OFFSET);
      if (demoEntry.entries.length === 0) return;
      const player = demoEntry.entries[0];
      setCurrentPlayerId(player.playerId);
      const rankData = await getOwnRank(player.playerId);
      setCurrentPlayerRank(rankData);
    } catch {
      // silent — demo player is optional
    }
  }, []);

  useEffect(() => {
    fetchPage(page, region || undefined);
  }, [page, region, fetchPage]);

  useEffect(() => {
    loadDemoPlayer();
  }, [loadDemoPlayer]);

  const handleRegionChange = useCallback((newRegion: string) => {
    setRegion(newRegion);
    setPage(0);
  }, []);

  const handleSearchSelect = useCallback(async (result: PlayerSearchResult) => {
    setSearchHighlightId(result.playerId);
    const rank = result.currentRank;
    if (rank <= 100) {
      setPage(0);
    } else {
      const targetPage = Math.floor((rank - 1) / PAGE_SIZE);
      setPage(targetPage);
    }
  }, []);

  const totalPages = Math.ceil(totalPlayers / PAGE_SIZE);

  const handlePageChange = useCallback((newPage: number) => {
    const max = Math.ceil(totalPlayers / PAGE_SIZE) - 1;
    setPage(Math.max(0, Math.min(max, newPage)));
    setPageInput('');
  }, [totalPlayers]);

  const handlePageInputSubmit = useCallback(() => {
    const num = parseInt(pageInput, 10);
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      handlePageChange(num - 1);
    }
    setPageInput('');
  }, [pageInput, totalPages, handlePageChange]);

  const handleRowClick = useCallback(async (entry: LeaderboardEntry) => {
    try {
      const profile = await getPlayerProfile(entry.playerId);
      setDetailPlayer(profile);
    } catch {
      // silent
    }
  }, []);

  const isCurrentPlayerOnCurrentPage = currentPlayerRank
    && currentPlayerRank.rank > page * PAGE_SIZE
    && currentPlayerRank.rank <= (page + 1) * PAGE_SIZE;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>{strings.app.title}</h1>
      </header>

      {stats && <GlobalStatsBar stats={stats} />}

      {pool && <PrizePoolCard pool={pool} />}
      <PlayerSearch onSelect={handleSearchSelect} />

      <div className={styles.toolbar}>
        <RegionFilter value={region} onChange={handleRegionChange} />
        <div className={styles.toolbarSpacer} />
      </div>

      {loading && <LoadingSkeleton rows={10} />}

      {error && <ErrorBanner message={error} onRetry={() => fetchPage(page, region || undefined)} />}

      {!loading && !error && entries.length === 0 && <EmptyState />}

      {!loading && !error && entries.length > 0 && (
        <>
          <div className={styles.listHeader}>
            <span className={styles.colRank}>{strings.listHeader.rank}</span>
            <span className={styles.colName}>{strings.listHeader.player}</span>
            <span className={styles.colRegion}>{strings.listHeader.region}</span>
            <span className={styles.colLevel}>{strings.listHeader.level}</span>
            <span className={styles.colEarnings}>{strings.listHeader.earnings}</span>
          </div>

          <div className={styles.list}>
            {entries.map((entry) => (
              <LeaderboardRow
                key={entry.playerId}
                entry={entry}
                isSelf={entry.playerId === currentPlayerId}
                isHighlighted={entry.playerId === searchHighlightId}
                onClick={() => handleRowClick(entry)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page === 0}
                onClick={() => handlePageChange(0)}
              >
                {strings.pagination.first}
              </button>
              <button
                className={styles.pageBtn}
                disabled={page === 0}
                onClick={() => handlePageChange(page - 1)}
              >
                {strings.pagination.prev}
              </button>
              <div className={styles.pageSelector}>
                <input
                  ref={pageInputRef}
                  className={styles.pageInput}
                  type="text"
                  inputMode="numeric"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePageInputSubmit(); }}
                  onBlur={handlePageInputSubmit}
                  placeholder={`${page + 1}`}
                />
                <span className={styles.pageDivider}>/</span>
                <span className={styles.pageTotal}>{totalPages}</span>
              </div>
              <button
                className={styles.pageBtn}
                disabled={page >= totalPages - 1}
                onClick={() => handlePageChange(page + 1)}
              >
                {strings.pagination.next}
              </button>
              <button
                className={styles.pageBtn}
                disabled={page >= totalPages - 1}
                onClick={() => handlePageChange(totalPages - 1)}
              >
                {strings.pagination.last}
              </button>
            </div>
          )}

          {/*
          <div className={styles.totalInfo}>
            {strings.pagination.totalPlayers.replace('{count}', totalPlayers.toLocaleString())}
          </div>
            */}
        </>
      )}

      {currentPlayerRank && currentPlayerId && !isCurrentPlayerOnCurrentPage && (
        <OwnRankCluster data={currentPlayerRank} />
      )}

      {detailPlayer && (
        <PlayerDetailModal
          profile={detailPlayer}
          currentPlayerId={currentPlayerId}
          currentPlayerRank={currentPlayerRank}
          onClose={() => setDetailPlayer(null)}
        />
      )}

      <Footer />
    </div>
  );
}

export default App;
