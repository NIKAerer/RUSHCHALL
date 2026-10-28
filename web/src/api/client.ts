import type { Climb, JunglePathing, MatchDetail, MatchSummary, PlayerStats, Profile, StatsFilters, SyncReport } from './types'

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, { ...init, headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) } })
  } catch {
    throw new ApiError(0, 'api_unreachable', "L'API Challenger ne répond pas. Elle est bien lancée sur le port 8000 ?")
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(response.status, body?.error ?? 'unknown', body?.message ?? `Erreur ${response.status}`)
  }

  return response.json() as Promise<T>
}

const riotId = (gameName: string, tagLine: string) => `${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`

export const api = {
  profile: () => request<Profile>('/api/profile'),
  games: (start: number, count: number) => request<MatchSummary[]>(`/api/games?start=${start}&count=${count}`),
  game: (matchId: string) => request<MatchDetail>(`/api/games/${encodeURIComponent(matchId)}`),
  pathing: (matchId: string) => request<JunglePathing>(`/api/games/${encodeURIComponent(matchId)}/pathing`),
  stats: (filters: StatsFilters) => {
    const query = new URLSearchParams()
    if (filters.champion) query.set('champion', filters.champion)
    if (filters.days) query.set('days', String(filters.days))
    return request<PlayerStats>(`/api/stats${query.size ? `?${query}` : ''}`)
  },
  player: (gameName: string, tagLine: string) => request<Profile>(`/api/players/${riotId(gameName, tagLine)}`),
  playerGames: (gameName: string, tagLine: string, start: number, count: number) =>
    request<MatchSummary[]>(`/api/players/${riotId(gameName, tagLine)}/games?start=${start}&count=${count}`),
  liveGame: (matchId: string) => request<MatchDetail>(`/api/matches/${encodeURIComponent(matchId)}`),
  climb: () => request<Climb>('/api/climb'),
  sync: () => request<SyncReport>('/api/games/sync', { method: 'POST' }),
  setRoutine: (matchId: string, routine: boolean) =>
    request<{ matchId: string; routine: boolean }>(`/api/games/${encodeURIComponent(matchId)}/routine`, { method: 'PUT', body: JSON.stringify({ routine }) }),
}
