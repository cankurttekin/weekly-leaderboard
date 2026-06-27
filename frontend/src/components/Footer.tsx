import { strings } from '../i18n/strings';
import styles from './Footer.module.css';

export function Footer(): React.ReactNode {
  return (
    <footer className={styles.footer}>
      <div className={styles.links}>
        <a className={styles.link} href="https://github.com/cankurttekin/leaderboard-app" target="_blank" rel="noopener noreferrer">
          {strings.footer.sourceCode}
        </a>
        <span className={styles.separator}>·</span>
        <span className={styles.license}>{strings.footer.license}</span>
      </div>
      <span className={styles.builtWith}>{strings.footer.builtWith}</span>
    </footer>
  );
}
