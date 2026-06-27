import { REGIONS } from '../types/leaderboard';
import { strings } from '../i18n/strings';
import styles from './RegionFilter.module.css';

interface Props {
  value: string;
  onChange: (region: string) => void;
}

export function RegionFilter({ value, onChange }: Props): React.ReactNode {
  return (
    <div className={styles.wrapper}>
      <select
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{strings.regionFilter.all}</option>
        {REGIONS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
    </div>
  );
}
