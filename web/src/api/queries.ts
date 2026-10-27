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

export function useGame(matchId: string) {
  return useQuery({
    queryKey: ['game', matchId],
    queryFn: () => api.game(matchId),
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
