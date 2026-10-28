import { Navigate, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { usePlayer, usePlayerGames, useProfile } from '../api/queries'
import { ErrorState } from '../components/ErrorState'
import { MatchList } from '../components/MatchList'
import { ProfileHeader } from '../components/ProfileHeader'
import styles from './ProfilePage.module.css'

/** Un autre joueur, cherché depuis la barre du haut : lu en direct chez Riot, rien n'est enregistré. */
export function PlayerPage() {
  const { gameName = '', tagLine = '' } = useParams()
  const { data: tracked } = useProfile()
  const player = usePlayer(gameName, tagLine)
  const games = usePlayerGames(gameName, tagLine)
  const matches = games.data?.pages.flat() ?? []

  if (player.isPending) return <div className={styles.skeleton} aria-busy="true" />
  if (player.isError) {
    return player.error instanceof ApiError && player.error.status === 404 ? (
      <ErrorState title="Joueur introuvable" message={`Personne ne s'appelle ${gameName}#${tagLine} sur EUW. Vérifie le pseudo et le tag.`} />
    ) : (
      <ErrorState title="Impossible de charger ce joueur" message={player.error.message} />
    )
  }
  // Se chercher soi-même ramène à son propre historique, avec LP et routine.
  if (player.data.puuid === tracked?.puuid) return <Navigate to="/" replace />

  return (
    <div className={styles.page}>
      <ProfileHeader
        profile={player.data}
        recent={{ games: matches.filter((m) => !m.remake).length, wins: matches.filter((m) => !m.remake && m.player.win).length }}
      />
      {games.isError ? (
        <ErrorState title="Impossible de charger les games" message={games.error.message} />
      ) : (
        <MatchList
          caption="En direct · rien n'est enregistré"
          matches={matches}
          puuid={player.data.puuid}
          loading={games.isPending}
          hasMore={games.hasNextPage}
          loadingMore={games.isFetchingNextPage}
          onLoadMore={() => games.fetchNextPage()}
          live
        />
      )}
    </div>
  )
}
