import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useMatchHistory, useProfile } from '../api/queries'
import { ErrorState } from '../components/ErrorState'
import { MatchList } from '../components/MatchList'
import { ProfileHeader } from '../components/ProfileHeader'
import { RecentSummary } from '../components/RecentSummary'
import { parseRiotId } from '../lib/riot'
import styles from './ProfilePage.module.css'

const FILTERS = [
  { label: 'Toutes', queue: undefined },
  { label: 'Solo/Duo', queue: 420 },
  { label: 'Flex', queue: 440 },
] as const

export function ProfilePage() {
  const riotId = parseRiotId(decodeURIComponent(useParams().riotId ?? ''))
  if (!riotId) return <ErrorState title="Pseudo invalide" message="Utilise le format Pseudo#TAG." />
  return <Profile key={`${riotId.gameName}#${riotId.tagLine}`} gameName={riotId.gameName} tagLine={riotId.tagLine} />
}

function Profile({ gameName, tagLine }: { gameName: string; tagLine: string }) {
  const queryClient = useQueryClient()
  const [queue, setQueue] = useState<number | undefined>(undefined)
  const profile = useProfile(gameName, tagLine)
  const history = useMatchHistory(profile.data?.puuid, queue)
  const matches = history.data?.pages.flat() ?? []

  if (profile.isPending) return <div className={styles.skeleton} aria-busy="true" />
  if (profile.isError) return <ErrorState title="Impossible de charger le profil" message={profile.error.message} />

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['profile'] })
    await queryClient.resetQueries({ queryKey: ['matches', profile.data?.puuid] })
  }

  return (
    <div className={styles.page}>
      <ProfileHeader profile={profile.data} onRefresh={refresh} refreshing={profile.isFetching || history.isFetching} />

      <div className={styles.toolbar}>
        <h2>Historique</h2>
        <div className={styles.filters} role="group" aria-label="File de jeu">
          {FILTERS.map((filter) => (
            <button key={filter.label} type="button" aria-pressed={queue === filter.queue} onClick={() => setQueue(filter.queue)}>
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {matches.length > 0 && <RecentSummary matches={matches} />}

      {history.isError ? (
        <ErrorState title="Impossible de charger les games" message={history.error.message} />
      ) : (
        <MatchList
          matches={matches}
          puuid={profile.data.puuid}
          loading={history.isPending}
          hasMore={history.hasNextPage}
          loadingMore={history.isFetchingNextPage}
          onLoadMore={() => history.fetchNextPage()}
        />
      )}
    </div>
  )
}
