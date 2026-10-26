import type { MatchSummary } from '../api/types'
import { MatchRow } from './MatchRow'
import styles from './MatchList.module.css'

interface Props {
  matches: MatchSummary[]
  puuid: string
  loading: boolean
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
}

export function MatchList({ matches, puuid, loading, hasMore, loadingMore, onLoadMore }: Props) {
  if (loading) {
    return (
      <div className={styles.list} aria-busy="true">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={styles.placeholder} />
        ))}
      </div>
    )
  }

  if (matches.length === 0) return <p className={styles.empty}>Aucune game trouvée pour ce filtre.</p>

  return (
    <div className={styles.list}>
      {matches.map((match) => (
        <MatchRow key={match.matchId} match={match} puuid={puuid} />
      ))}
      {hasMore && (
        <button type="button" className={styles.more} onClick={onLoadMore} disabled={loadingMore}>
          {loadingMore ? 'Chargement…' : 'Voir plus de games'}
        </button>
      )}
    </div>
  )
}
