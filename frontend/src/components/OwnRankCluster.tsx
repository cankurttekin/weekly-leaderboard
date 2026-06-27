import type { OwnRankResponse, LeaderboardEntry } from '../types/leaderboard';
import styles from './OwnRankCluster.module.css';

interface Props {
  data: OwnRankResponse;
}

function CompactRow({ entry }: { entry: LeaderboardEntry }): React.ReactNode {
  return (
    <div className={styles.compactRow}>
      <span className={styles.compactRank}>#{entry.rank}</span>
      <span className={styles.compactName}>{entry.username}</span>
      <span className={styles.compactEarnings}>{entry.earnings.toLocaleString()}</span>
    </div>
  );
}

function SelfRow({ rank, name, earnings }: { rank: number; name: string; earnings: number }): React.ReactNode {
  return (
    <div className={styles.selfRow}>
      <span className={styles.selfRank}>#{rank}</span>
      <span className={styles.selfName}>{name}</span>
      <span className={styles.selfEarnings}>{earnings.toLocaleString()}</span>
    </div>
  );
}

export function OwnRankCluster({ data }: Props): React.ReactNode {
  return (
    <div className={styles.cluster}>
      <div className={styles.bar}>
        <div className={styles.entries}>
          {data.above.map((entry) => (
            <CompactRow key={entry.playerId} entry={entry} />
          ))}
          <SelfRow rank={data.rank} name={data.username} earnings={data.earnings} />
          {data.below.map((entry) => (
            <CompactRow key={entry.playerId} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  );
}
