import { Fragment } from 'react'
import type { MatchSummary } from '../api/types'
import { MatchRow } from './MatchRow'
import styles from './MatchList.module.css'

const date = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

/** « Aujourd'hui », « Hier », sinon la date : un repère par journée de jeu. */
function dayLabel(timestamp: number, now = new Date()): string {
  const day = new Date(timestamp).toDateString()
  if (day === now.toDateString()) return "Aujourd'hui"
  if (day === new Date(now.getTime() - 86_400_000).toDateString()) return 'Hier'
  const text = date.format(timestamp)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

interface Props {
  /** Ligne de droite du titre, par exemple le nombre de games en base. */
  caption?: string
  matches: MatchSummary[]
  puuid: string
  loading: boolean
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
}

export function MatchList({ caption, matches, puuid, loading, hasMore, loadingMore, onLoadMore }: Props) {
  const title = (
    <div className={styles.title}>
      <h2>Dernières parties</h2>
      {caption && <span>{caption}</span>}
    </div>
  )

  if (loading) {
    return (
      <section className={styles.list} aria-busy="true">
        {title}
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={styles.placeholder} />
        ))}
      </section>
    )
  }

  return (
    <section className={styles.list}>
      {title}
      {matches.length === 0 && <p className={styles.empty}>Aucune game en base pour l'instant.</p>}
      {matches.map((match, i) => {
        const day = dayLabel(match.startedAt)
        return (
          <Fragment key={match.matchId}>
            {(i === 0 || dayLabel(matches[i - 1].startedAt) !== day) && <h3 className={styles.day}>{day}</h3>}
            <MatchRow match={match} puuid={puuid} />
          </Fragment>
        )
      })}
      {hasMore && (
        <button type="button" className={styles.more} onClick={onLoadMore} disabled={loadingMore}>
          {loadingMore ? 'Chargement…' : 'Voir plus de games'}
        </button>
      )}
    </section>
  )
}
