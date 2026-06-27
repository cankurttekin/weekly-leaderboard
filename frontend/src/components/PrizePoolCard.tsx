import type { PrizePoolInfo } from '../types/leaderboard';
import { strings } from '../i18n/strings';
import { CountdownTimer } from './CountdownTimer';
import styles from './PrizePoolCard.module.css';

interface Props {
  pool: PrizePoolInfo;
}

export function PrizePoolCard({ pool }: Props): React.ReactNode {
  return (
    <div className={styles.card}>
      <div className={styles.poolSection}>
        <span className={styles.label}>{strings.prizePool.label}</span>
        <span className={styles.amount}>{pool.poolAmount.toLocaleString()}</span>
      </div>
      <div className={styles.detail}>
        <span>{strings.prizePool.totalEarnings.replace('{amount}', pool.totalEarnings.toLocaleString())}</span>
        <span className={styles.shareNote}>{strings.prizePool.shareNote}</span>
      </div>
      <CountdownTimer targetMs={pool.countdownMs} resetAt={pool.resetAt} />
    </div>
  );
}
