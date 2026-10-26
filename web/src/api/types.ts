export type RankedQueue = 'solo' | 'flex'

export interface RankedEntry {
  queue: RankedQueue
  tier: string
  division: string | null
  leaguePoints: number
  wins: number
  losses: number
}

export interface Profile {
  puuid: string
  gameName: string
  tagLine: string
  platform: string
  profileIconId: number
  summonerLevel: number
  ranked: RankedEntry[]
}

export type Position = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY'

export interface Participant {
  puuid: string
  gameName: string
  tagLine: string
  teamId: number
  position: Position | null
  championName: string
  championLevel: number
  win: boolean
  kills: number
  deaths: number
  assists: number
  killParticipation: number
  largestMultiKill: number
  cs: number
  csPerMinute: number
  gold: number
  damageToChampions: number
  damageTaken: number
  visionScore: number
  wardsPlaced: number
  wardsKilled: number
  controlWardsBought: number
  items: number[]
  trinket: number
  summonerSpells: [number, number]
  keystone: number
  secondaryRuneStyle: number
}

export interface Lineup {
  puuid: string
  gameName: string
  tagLine: string
  teamId: number
  championName: string
}

export interface MatchSummary {
  matchId: string
  queueId: number
  startedAt: number
  durationSeconds: number
  remake: boolean
  player: Participant
  lineup: Lineup[]
}

export interface TeamObjectives {
  towers: number
  inhibitors: number
  dragons: number
  barons: number
  riftHeralds: number
  voidGrubs: number
  atakhans: number
}

export interface Team {
  teamId: number
  win: boolean
  kills: number
  gold: number
  objectives: TeamObjectives
  participants: Participant[]
}

export interface MatchDetail {
  matchId: string
  queueId: number
  startedAt: number
  durationSeconds: number
  remake: boolean
  gameVersion: string
  teams: [Team, Team]
}
