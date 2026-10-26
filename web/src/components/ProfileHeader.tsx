import { useState } from 'react'
import type { Profile, RankedEntry } from '../api/types'
import { profileIcon, rankEmblem } from '../ddragon/ddragon'
import { useStaticData } from '../ddragon/useStaticData'
import { formatPercent, winrate } from '../lib/format'
import { tierLabel } from '../lib/riot'
import styles from './ProfileHeader.module.css'

const QUEUE_NAMES = { solo: 'Classé Solo/Duo', flex: 'Classé Flex' } as const

export function ProfileHeader({ profile, onRefresh, refreshing }: { profile: Profile; onRefresh: () => void; refreshing: boolean }) {
  const data = useStaticData()

  return (
    <section className={styles.header}>
      <div className={styles.identity}>
        <div className={styles.avatar}>
          {data && <img src={profileIcon(data.version, profile.profileIconId)} alt="" />}
          <span>{profile.summonerLevel}</span>
        </div>
        <div className={styles.name}>
          <h1>
            {profile.gameName} <span>#{profile.tagLine}</span>
          </h1>
          <div className={styles.meta}>
            <span className={styles.badge}>{profile.platform.replace(/\d+$/, '').toUpperCase()}</span>
            <button type="button" className={styles.refresh} onClick={onRefresh} disabled={refreshing}>
              {refreshing ? 'Mise à jour…' : 'Mettre à jour'}
            </button>
          </div>
        </div>
      </div>
      <div className={styles.ranks}>
        {(['solo', 'flex'] as const).map((queue) => (
          <RankCard key={queue} label={QUEUE_NAMES[queue]} entry={profile.ranked.find((r) => r.queue === queue)} />
        ))}
      </div>
    </section>
  )
}

function RankCard({ label, entry }: { label: string; entry: RankedEntry | undefined }) {
  const [emblemFailed, setEmblemFailed] = useState(false)

  return (
    <div className={styles.rank}>
      <span className={styles.emblem}>
        {entry && !emblemFailed && <img src={rankEmblem(entry.tier)} alt="" onError={() => setEmblemFailed(true)} />}
      </span>
      <div>
        <div className={styles.queue}>{label}</div>
        {entry ? (
          <>
            <div className={styles.tier}>
              {tierLabel(entry.tier, entry.division)} <b>{entry.leaguePoints} LP</b>
            </div>
            <div className={styles.record}>
              {entry.wins}V {entry.losses}D · {formatPercent(winrate(entry.wins, entry.losses))}
            </div>
          </>
        ) : (
          <div className={styles.record}>Non classé</div>
        )}
      </div>
    </div>
  )
}
