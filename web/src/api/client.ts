import type { MatchDetail, MatchSummary, Profile } from './types'

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function getJson<T>(path: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, { headers: { Accept: 'application/json' } })
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
  profile: (gameName: string, tagLine: string) =>
    getJson<Profile>(`/api/profiles/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`),

  matches: (puuid: string, params: { start: number; count: number; queue?: number }) => {
    const query = new URLSearchParams({ start: String(params.start), count: String(params.count) })
    if (params.queue !== undefined) query.set('queue', String(params.queue))
    return getJson<MatchSummary[]>(`/api/players/${encodeURIComponent(puuid)}/matches?${query}`)
  },

  match: (matchId: string) => getJson<MatchDetail>(`/api/matches/${encodeURIComponent(matchId)}`),
}
