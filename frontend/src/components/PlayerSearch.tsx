import { useState, useCallback } from 'react';
import type { PlayerSearchResult } from '../types/leaderboard';
import { searchPlayers } from '../api/client';
import { strings } from '../i18n/strings';
import styles from './PlayerSearch.module.css';

interface Props {
  onSelect: (result: PlayerSearchResult) => void;
}

export function PlayerSearch({ onSelect }: Props): React.ReactNode {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await searchPlayers(q, 8);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = (result: PlayerSearchResult): void => {
    setQuery('');
    setResults([]);
    onSelect(result);
  };

  return (
    <div className={styles.search}>
      <input
        className={styles.input}
        type="text"
        placeholder={strings.search.placeholder}
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {loading && <span className={styles.spinner} />}
      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((r) => (
            <li key={r.playerId} className={styles.resultItem} onClick={() => handleSelect(r)}>
              <span className={styles.name}>{r.username}</span>
              <span className={styles.rankInfo}>
                Rank #{r.currentRank} · {r.earnings.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
