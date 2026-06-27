import { strings } from '../i18n/strings';
import styles from './ErrorBanner.module.css';

interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: Props): React.ReactNode {
  return (
    <div className={styles.banner}>
      <span className={styles.message}>{message}</span>
      {onRetry && (
        <button className={styles.retry} onClick={onRetry}>
          {strings.error.retry}
        </button>
      )}
    </div>
  );
}
