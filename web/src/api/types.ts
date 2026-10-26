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

export interface SyncReport {
  saved: number
  remaining: number
  total: number
}

export type Zone = 'base' | 'top' | 'mid' | 'bot' | 'river' | 'allyJungle' | 'enemyJungle'

export interface PathPoint {
  t: number
  x: number
  y: number
  zone: Zone
}

export type MomentType = 'gank' | 'kill' | 'assist' | 'death' | 'objective'

export interface Moment extends PathPoint {
  type: MomentType
  label: string
}

export interface JunglerStats {
  startSide: 'haut' | 'bas' | null
  csAt10: number | null
  goldAt10: number | null
  levelAt10: number | null
  ganksBefore14: number
  minutesInEnemyJungle: number
  objectives: number
}

export interface JunglerPath {
  puuid: string
  gameName: string
  championName: string
  teamId: number
  isTrackedPlayer: boolean
  points: PathPoint[]
  moments: Moment[]
  stats: JunglerStats
}

export interface Objective {
  t: number
  type: 'dragon' | 'baron' | 'herald' | 'grubs' | 'atakhan'
  label: string
  teamId: number
  x: number
  y: number
}

export interface JunglePathing {
  matchId: string
  durationSeconds: number
  junglers: JunglerPath[]
  objectives: Objective[]
}
