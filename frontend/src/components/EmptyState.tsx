import { strings } from '../i18n/strings';
import styles from './EmptyState.module.css';

export function EmptyState(): React.ReactNode {
  return (
    <div className={styles.empty}>
      <span className={styles.icon}>🏆</span>
      <h2 className={styles.title}>{strings.emptyState.title}</h2>
      <p className={styles.text}>{strings.emptyState.text}</p>
    </div>
  );
}
