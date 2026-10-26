import type { Rating } from '../api/types'
import styles from './RatingBadge.module.css'

/** Note dpm-style : le score sur 10 et, à côté, MVP / ACE ou le rang dans la game. */
export function RatingBadge({ rating, compact = false }: { rating: Rating; compact?: boolean }) {
  const score = rating.score.toFixed(1).replace('.', ',')
  const tag = rating.badge ?? `${rating.rank}${rating.rank === 1 ? 'er' : 'e'}`

  return (
    <span
      className={`${styles.rating} ${compact ? styles.compact : ''} ${rating.badge ? styles[rating.badge.toLowerCase()] : ''}`}
      title={`Note ${score}/10 · ${rating.rank}${rating.rank === 1 ? 'er' : 'e'} sur 10`}
    >
      {!compact && <b>{score}</b>}
      <span className={styles.tag}>{tag}</span>
    </span>
  )
}
