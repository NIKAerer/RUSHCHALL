import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

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

/** Récupère chez Riot les nouvelles games Solo/Duo, puis recharge le profil et l'historique. */
export function useSync() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.sync,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.resetQueries({ queryKey: ['games'] }),
      ])
    },
  })
}
