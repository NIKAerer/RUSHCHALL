import { useState } from 'react'
import type { Profile } from '../api/types'
import { profileIcon, rankEmblem } from '../ddragon/ddragon'
import { useStaticData } from '../ddragon/useStaticData'
import { tierLabel } from '../lib/riot'
import styles from './ProfileHeader.module.css'

/** En-tête de l'historique : l'identité sur une carte, le rang Solo/Duo sur une carte foncée. */
export function ProfileHeader({
  profile,
  recent,
  onRefresh,
  refreshing,
}: {
  profile: Profile
  /** Bilan des games chargées, affiché sous le rang. */
  recent: { games: number; wins: number }
  onRefresh: () => void
  refreshing: boolean
}) {
  const data = useStaticData()
  const [emblemFailed, setEmblemFailed] = useState(false)
  const solo = profile.ranked.find((r) => r.queue === 'solo')

  return (
    <section className={styles.header}>
      <div className={styles.identity}>
        <div className={styles.avatar}>{data && <img src={profileIcon(data.version, profile.profileIconId)} alt="" />}</div>
        <div className={styles.name}>
          <h1>
            {profile.gameName} <span>#{profile.tagLine}</span>
          </h1>
          <span className={styles.meta}>
            Niveau {profile.summonerLevel} · {profile.platform.replace(/\d+$/, '').toUpperCase()}
          </span>
        </div>
        <button type="button" className={styles.refresh} onClick={onRefresh} disabled={refreshing}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className={refreshing ? styles.spinning : undefined}>
            <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" />
          </svg>
          {refreshing ? 'Mise à jour…' : 'Mettre à jour'}
        </button>
      </div>

      <div className={styles.rank}>
        <span className={styles.queue}>
          {solo && !emblemFailed && <img src={rankEmblem(solo.tier)} alt="" onError={() => setEmblemFailed(true)} />}
          {solo ? `${tierLabel(solo.tier, solo.division)} · Solo/Duo` : 'Solo/Duo'}
        </span>
        {solo ? (
          <b className={styles.lp}>
            {solo.leaguePoints} <small>LP</small>
          </b>
        ) : (
          <b className={styles.lp}>Non classé</b>
        )}
        {recent.games > 0 && (
          <span className={styles.record}>
            {recent.wins} V · {recent.games - recent.wins} D sur {recent.games} games
          </span>
        )}
      </div>
    </section>
  )
}
