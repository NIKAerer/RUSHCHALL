import type { JunglePathing, MatchDetail, MatchSummary, PlayerStats, Profile, SyncReport } from './types'

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
    response = await fetch(path, { ...init, headers: { Accept: 'application/json' } })
  } catch {
    throw new ApiError(0, 'api_unreachable', "L'API Challenger ne répond pas. Elle est bien lancée sur le port 8000 ?")
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(response.status, body?.error ?? 'unknown', body?.message ?? `Erreur ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const api = {
  profile: () => request<Profile>('/api/profile'),
  games: (start: number, count: number) => request<MatchSummary[]>(`/api/games?start=${start}&count=${count}`),
  game: (matchId: string) => request<MatchDetail>(`/api/games/${encodeURIComponent(matchId)}`),
  pathing: (matchId: string) => request<JunglePathing>(`/api/games/${encodeURIComponent(matchId)}/pathing`),
  stats: () => request<PlayerStats>('/api/stats'),
  sync: () => request<SyncReport>('/api/games/sync', { method: 'POST' }),
}
