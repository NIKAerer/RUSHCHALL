import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { api } from './client'

export const PAGE_SIZE = 10

export function useProfile(gameName: string, tagLine: string) {
  return useQuery({
    queryKey: ['profile', gameName.toLowerCase(), tagLine.toLowerCase()],
    queryFn: () => api.profile(gameName, tagLine),
  })
}

export function useMatchHistory(puuid: string | undefined, queue: number | undefined) {
  return useInfiniteQuery({
    queryKey: ['matches', puuid, queue ?? 'all'],
    queryFn: ({ pageParam }) => api.matches(puuid!, { start: pageParam, count: PAGE_SIZE, queue }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => (lastPage.length < PAGE_SIZE ? undefined : pages.length * PAGE_SIZE),
    enabled: puuid !== undefined,
  })
}

export function useMatchDetail(matchId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['match', matchId],
    queryFn: () => api.match(matchId),
    enabled,
    // Une game terminée ne change plus.
    staleTime: Infinity,
  })
}
