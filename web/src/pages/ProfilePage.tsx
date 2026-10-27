import { useEffect, useRef } from 'react'
import { useGames, useProfile, useSync } from '../api/queries'
import { ErrorState } from '../components/ErrorState'
import { MatchList } from '../components/MatchList'
import { ProfileHeader } from '../components/ProfileHeader'
import { RecentSummary } from '../components/RecentSummary'
import type { MatchSummary } from '../api/types'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
  const profile = useProfile()
  const games = useGames()
  const sync = useSync()
  const matches = games.data?.pages.flat() ?? []

  // Une synchro légère à l'ouverture : la game qu'on vient de finir apparaît sans rien faire.
  const syncedOnOpen = useRef(false)
  useEffect(() => {
    if (syncedOnOpen.current) return
    syncedOnOpen.current = true
    sync.mutate()
  }, [sync])

  if (profile.isPending) return <div className={styles.skeleton} aria-busy="true" />
  if (profile.isError) return <ErrorState title="Impossible de charger le profil" message={profile.error.message} />

  return (
    <div className={styles.page}>
      <ProfileHeader profile={profile.data} bannerChampion={mostPlayed(matches, profile.data.puuid)} onRefresh={() => sync.mutate()} refreshing={sync.isPending} />

      {sync.isError && <ErrorState title="Mise à jour impossible" message={sync.error.message} />}
      {sync.data && sync.data.remaining > 0 && (
        <p className={styles.notice}>
          {sync.data.remaining} games plus anciennes ne sont pas encore en base : lance <code>npm run sync</code> pour les récupérer.
        </p>
      )}

      <div className={styles.toolbar}>
        <h2>Historique Solo/Duo</h2>
        {sync.data && <span className={styles.count}>{sync.data.total} games en base</span>}
      </div>

      {matches.length > 0 && <RecentSummary matches={matches} />}

      {games.isError ? (
        <ErrorState title="Impossible de charger les games" message={games.error.message} />
      ) : (
        <MatchList
          matches={matches}
          puuid={profile.data.puuid}
          loading={games.isPending}
          hasMore={games.hasNextPage}
          loadingMore={games.isFetchingNextPage}
          onLoadMore={() => games.fetchNextPage()}
        />
      )}
    </div>
  )
}

function mostPlayed(matches: MatchSummary[], puuid: string): string | null {
  const counts = new Map<string, number>()
  for (const { player } of matches) {
    if (player.puuid === puuid) counts.set(player.championName, (counts.get(player.championName) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}
