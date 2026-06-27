import { useState, useEffect } from 'react';
import { strings } from '../i18n/strings';
import styles from './CountdownTimer.module.css';

interface Props {
  targetMs: number;
  resetAt: string;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return strings.countdown.resetting;
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function CountdownTimer({ targetMs }: Props): React.ReactNode {
  const [remaining, setRemaining] = useState(targetMs);

  useEffect(() => {
    setRemaining(targetMs);
    const interval = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetMs]);

  return (
    <div className={styles.timer}>
      <span className={styles.label}>{strings.countdown.label}</span>
      <span className={styles.value}>{formatCountdown(remaining)}</span>
    </div>
  );
}
