import type { LeaderboardEntry } from '../types/leaderboard';
import { strings } from '../i18n/strings';
import styles from './LeaderboardRow.module.css';

interface Props {
  entry: LeaderboardEntry;
  isSelf?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
}

const RANK_CLASS: Record<number, string> = {
  1: styles.rankGold,
  2: styles.rankSilver,
  3: styles.rankBronze,
};

export function LeaderboardRow({ entry, isSelf, isHighlighted, onClick }: Props): React.ReactNode {
  const rankClass = entry.rank <= 3 ? RANK_CLASS[entry.rank] : '';

  const className = [
    styles.row,
    isSelf ? styles.self : '',
    isHighlighted && !isSelf ? styles.highlighted : '',
    onClick ? styles.clickable : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={className} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      <span className={`${styles.rank} ${rankClass}`}>#{entry.rank}</span>
      <span className={styles.username}>{entry.username}</span>
      <span className={styles.regionBadge}>{entry.region}</span>
      <span className={styles.level}>{strings.listHeader.level}{entry.level}</span>
      <span className={styles.earnings}>{entry.earnings.toLocaleString()}</span>
      {entry.prize !== undefined && (
        <span className={styles.prize}>+{entry.prize.toLocaleString()}</span>
      )}
    </div>
  );
}
