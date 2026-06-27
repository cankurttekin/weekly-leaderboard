import styles from './LoadingSkeleton.module.css';

interface Props {
  rows?: number;
}

export function LoadingSkeleton({ rows = 10 }: Props): React.ReactNode {
  return (
    <div className={styles.skeleton}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.row}>
          <div className={styles.rank} />
          <div className={styles.name} />
          <div className={styles.score} />
        </div>
      ))}
    </div>
  );
}
