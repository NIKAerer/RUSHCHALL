import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { api } from './client'
import type { MatchSummary, StatsFilters } from './types'

export const PAGE_SIZE = 10

export function useProfile() {
  return useQuery({ queryKey: ['profile'], queryFn: api.profile })
}

export function useGames() {
  return useInfiniteQuery({
    queryKey: ['games'],
    queryFn: ({ pageParam }) => api.games(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => (lastPage.length < PAGE_SIZE ? undefined : pages.length * PAGE_SIZE),
  })
}

/** `live` : game d'un joueur cherché, lue chez Riot si elle n'est pas en base. */
export function useGame(matchId: string, live = false) {
  return useQuery({
    queryKey: ['game', matchId],
    queryFn: () => (live ? api.liveGame(matchId) : api.game(matchId)),
    // Une game terminée ne change plus.
    staleTime: Infinity,
  })
}

export function usePathing(matchId: string) {
  return useQuery({
    queryKey: ['pathing', matchId],
    queryFn: () => api.pathing(matchId),
    staleTime: Infinity,
  })
}

/** Seuils GM et Challenger : Riot les recalcule une fois par jour, inutile de les redemander souvent. */
export function useClimb() {
  return useQuery({ queryKey: ['climb'], queryFn: api.climb, staleTime: 10 * 60_000 })
}

/** Joueur cherché : lu en direct chez Riot, gardé en mémoire le temps de la session, jamais enregistré. */
export function usePlayer(gameName: string, tagLine: string) {
  return useQuery({ queryKey: ['player', gameName, tagLine], queryFn: () => api.player(gameName, tagLine), staleTime: 120_000 })
}

export function usePlayerGames(gameName: string, tagLine: string) {
  return useInfiniteQuery({
    queryKey: ['player-games', gameName, tagLine],
    queryFn: ({ pageParam }) => api.playerGames(gameName, tagLine, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => (lastPage.length < PAGE_SIZE ? undefined : pages.length * PAGE_SIZE),
    // Chaque page coûte une requête Riot par game : on ne la redemande pas à chaque visite.
    staleTime: 120_000,
  })
}

export function useStats(filters: StatsFilters = {}) {
  return useQuery({ queryKey: ['stats', filters], queryFn: () => api.stats(filters), placeholderData: keepPreviousData })
}

/** Coche ou décoche « routine » sur une game ; la case change tout de suite, et revient en arrière si l'API refuse. */
export function useRoutine() {
  const queryClient = useQueryClient()
  const apply = (matchId: string, routine: boolean) =>
    queryClient.setQueryData<InfiniteData<MatchSummary[]>>(['games'], (data) =>
      data && { ...data, pages: data.pages.map((page) => page.map((game) => (game.matchId === matchId ? { ...game, routine } : game))) },
    )

  return useMutation({
    mutationFn: ({ matchId, routine }: { matchId: string; routine: boolean }) => api.setRoutine(matchId, routine),
    onMutate: ({ matchId, routine }) => apply(matchId, routine),
    onError: (_error, { matchId, routine }) => apply(matchId, !routine),
  })
}

/** Récupère chez Riot les nouvelles games Solo/Duo, puis recharge le profil et l'historique. */
export function useSync() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.sync,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.resetQueries({ queryKey: ['games'] }),
        queryClient.invalidateQueries({ queryKey: ['stats'] }),
      ])
    },
  })
}
