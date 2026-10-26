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

export interface Rating {
  score: number
  rank: number
  badge: 'MVP' | 'ACE' | null
}

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
  rating: Rating
}

export interface Lineup {
  puuid: string
  gameName: string
  tagLine: string
  teamId: number
  championName: string
  rating: Rating
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

export type Badge = 'first_blood' | 'double' | 'triple' | 'quadra' | 'penta' | 'ace' | 'shutdown' | 'soul'

/** Champion impliqué dans un moment fort. */
export interface Fighter {
  championName: string
  teamId: number
}

export interface Moment extends PathPoint {
  type: MomentType
  /** Auteur du kill ou du smite ; null pour une tourelle ou des sbires. */
  killer: Fighter | null
  victim: Fighter | null
  assists: Fighter[]
  /** Pour un objectif : infernal, ocean… pour un drake, sinon baron, herald, grubs ou atakhan. */
  objective: string | null
  /** Ce qui rend le moment marquant : first_blood, double, triple, quadra, penta, ace, shutdown, soul. */
  badges: Badge[]
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

export type CampSide = 'ally' | 'enemy' | 'river'

export interface ClearStep {
  t: number
  camp: 'blue' | 'gromp' | 'wolves' | 'raptors' | 'red' | 'krugs' | 'scuttle' | null
  label: string
  side: CampSide | null
  jungleCs: number
  x: number
  y: number
}

export interface FirstBack {
  t: number
  itemIds: number[]
  gold: number | null
}

export interface EarlyGame {
  clear: ClearStep[]
  clearEnd: number | null
  clearEndReason: 'back' | Exclude<MomentType, 'objective'> | null
  jungleCsAtClearEnd: number
  /** Seconde où le niveau 3, 4 et 6 est atteint. */
  levels: Record<'3' | '4' | '6', number | null>
  firstBack: FirstBack | null
  firstGank: Moment | null
  firstInvade: number | null
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
  earlyGame: EarlyGame
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
  /** Kills marquants sans jungler (first blood, triple kill…). */
  highlights: Moment[]
  gold: GoldPoint[]
}

/** Gold total à une minute : ton équipe contre l'adverse, ton jungler contre celui d'en face. */
export interface GoldPoint {
  t: number
  ally: number
  enemy: number
  allyJungler: number | null
  enemyJungler: number | null
}
