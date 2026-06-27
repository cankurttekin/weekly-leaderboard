import { useState } from 'react';
import type { PlayerProfile, OwnRankResponse } from '../types/leaderboard';
import { strings } from '../i18n/strings';
import styles from './PlayerDetailModal.module.css';

interface Props {
  profile: PlayerProfile;
  currentPlayerId: string | null;
  currentPlayerRank: OwnRankResponse | null;
  onClose: () => void;
}

interface ColumnProps {
  title: string;
  profile: PlayerProfile;
  showYou?: boolean;
  showFriendBtn?: boolean;
}

function PlayerColumn({ title, profile, showYou, showFriendBtn }: ColumnProps): React.ReactNode {
  const [friendAdded, setFriendAdded] = useState(false);

  return (
    <div className={styles.column}>
      <div className={styles.columnHeader}>
        <h3 className={styles.columnTitle}>{title}</h3>
      </div>
      {showYou && <span className={styles.youBadge}>{strings.playerDetail.you}</span>}
      {showFriendBtn && (
        <button
          className={`${styles.friendBtn} ${friendAdded ? styles.friendAdded : ''}`}
          onClick={(e) => { e.stopPropagation(); setFriendAdded(true); }}
        >
          {friendAdded ? strings.playerDetail.friendAdded : strings.playerDetail.addFriend}
        </button>
      )}
      <div className={styles.fields}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>{strings.playerDetail.rank}</span>
          <span className={styles.fieldValue}>#{profile.rank.toLocaleString()}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>{strings.playerDetail.region}</span>
          <span className={styles.regionTag}>{profile.region}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>{strings.playerDetail.level}</span>
          <span className={styles.fieldValue}>{profile.level}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>{strings.playerDetail.earnings}</span>
          <span className={styles.fieldValue}>{profile.earnings.toLocaleString()}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>{strings.playerDetail.playerId}</span>
          <span className={styles.fieldValue} style={{ fontSize: '0.75rem' }}>{profile.playerId.slice(0, 8)}</span>
        </div>
      </div>
    </div>
  );
}

export function PlayerDetailModal({ profile, currentPlayerId, currentPlayerRank, onClose }: Props): React.ReactNode {
  const currentProfile: PlayerProfile | null = (currentPlayerId && currentPlayerRank)
    ? {
        playerId: currentPlayerId,
        username: currentPlayerRank.username,
        region: currentPlayerRank.region,
        level: currentPlayerRank.level,
        rank: currentPlayerRank.rank,
        totalPlayers: currentPlayerRank.totalPlayers,
        earnings: currentPlayerRank.earnings,
      }
    : null;

  const isSamePlayer = currentPlayerId === profile.playerId;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>✕</button>
        <div className={styles.columns}>
          <PlayerColumn title={profile.username} profile={profile} showFriendBtn={!isSamePlayer} />
          {currentProfile && !isSamePlayer && (
            <>
              <div className={styles.divider} />
              <PlayerColumn title={currentProfile.username} profile={currentProfile} showYou />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
