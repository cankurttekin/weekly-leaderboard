import type { GlobalStats } from '../types/leaderboard';
import { strings } from '../i18n/strings';
import styles from './GlobalStatsBar.module.css';

interface Props {
  stats: GlobalStats;
}

export function GlobalStatsBar({ stats }: Props): React.ReactNode {
  return (
    <div className={styles.bar}>
      <div className={styles.stat}>
        <span className={styles.label}>{strings.globalStats.players}</span>
        <span className={styles.value}>{stats.totalPlayers.toLocaleString()}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.label}>{strings.globalStats.pool}</span>
        <span className={styles.value}>{stats.poolAmount.toLocaleString()}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.label}>{strings.globalStats.totalEarnings}</span>
        <span className={styles.value}>{stats.totalEarnings.toLocaleString()}</span>
      </div>
      {stats.topEarner && (
        <div className={styles.stat}>
          <span className={styles.label}>{strings.globalStats.topEarner}</span>
          <span className={styles.topEarner}>{stats.topEarner.username}</span>
          <span className={styles.value}>{stats.topEarner.earnings.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
