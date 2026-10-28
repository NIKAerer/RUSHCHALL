import { useEffect, useRef } from 'react'
import { useGames, useProfile, useSync } from '../api/queries'
import { ErrorState } from '../components/ErrorState'
import { MatchList } from '../components/MatchList'
import { ProfileHeader } from '../components/ProfileHeader'
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
      <ProfileHeader
        profile={profile.data}
        recent={{ games: matches.filter((m) => !m.remake).length, wins: matches.filter((m) => !m.remake && m.player.win).length }}
        onRefresh={() => sync.mutate()}
        refreshing={sync.isPending}
      />

      {sync.isError && <ErrorState title="Mise à jour impossible" message={sync.error.message} />}
      {sync.data && sync.data.remaining > 0 && (
        <p className={styles.notice}>
          {sync.data.remaining} games plus anciennes ne sont pas encore en base : lance <code>npm run sync</code> pour les récupérer.
        </p>
      )}

      {games.isError ? (
        <ErrorState title="Impossible de charger les games" message={games.error.message} />
      ) : (
        <MatchList
          caption={sync.data ? `${sync.data.total} games en base` : undefined}
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
