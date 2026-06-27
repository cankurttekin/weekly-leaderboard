import type { LeaderboardEntry } from '../types/leaderboard';
import { strings } from '../i18n/strings';
import styles from './PodiumDisplay.module.css';

interface Props {
  top3: LeaderboardEntry[];
}

const PODIUM_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];
const PODIUM_LABELS = strings.podium.labels;

export function PodiumDisplay({ top3 }: Props): React.ReactNode {
  if (top3.length === 0) return null;

  const ordered = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className={styles.podium}>
      {ordered.map((entry) => {
        const originalIndex = entry === top3[0] ? 0 : entry === top3[1] ? 1 : 2;
        return (
          <div
            key={entry.playerId}
            className={`${styles.podiumItem} ${styles[`height${originalIndex + 1}`]}`}
            style={{ '--podium-color': PODIUM_COLORS[originalIndex] } as React.CSSProperties}
          >
            <span className={styles.rank}>{PODIUM_LABELS[originalIndex]}</span>
            <span className={styles.username}>{entry.username}</span>
            <span className={styles.earnings}>{entry.earnings.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}
