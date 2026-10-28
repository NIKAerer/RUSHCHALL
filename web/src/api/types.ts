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
  /** LP gagnés ou perdus, null quand les relevés ne permettent pas de les attribuer à la game. */
  lpChange: number | null
  /** Case « routine respectée », cochée par le joueur. */
  routine: boolean
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

export interface WinRecord {
  key: string
  games: number
  wins: number
}

export interface MatchupStats {
  opponent: string
  games: number
  wins: number
  goldDiffAt15: number | null
}

export interface ChampionStats {
  championName: string
  games: number
  wins: number
  kills: number
  deaths: number
  assists: number
  csPerMinute: number
  goldAt15: number | null
  rating: number
  matchups: MatchupStats[]
}

export interface DiffStats {
  minute: number
  games: number
  gold: number
  xp: number
  cs: number
  aheadRate: number
}

export interface JungleStats {
  games: number
  starts: WinRecord[]
  routes: WinRecord[]
  firstGanks: WinRecord[]
  firstGankAt: number | null
}

export interface ObjectiveStats {
  type: 'grubs' | 'herald' | 'dragon' | 'atakhan' | 'baron'
  taken: number
  lost: number
  goldDiffTaken: number | null
  goldDiffLost: number | null
}

export interface Heatmap {
  size: number
  /** colonne, ligne, nombre de relevés */
  cells: [number, number, number][]
  deaths: [number, number][]
}

export interface LpPoint {
  t: number
  tier: string
  division: string | null
  leaguePoints: number
  ladder: number
}

export interface FormStats {
  streak: number
  longestWinStreak: number
  longestLossStreak: number
  recent: boolean[]
  byHour: WinRecord[]
  lp: LpPoint[]
}

export interface SessionRecord {
  startedAt: number
  games: number
  wins: number
  minutes: number
  /** LP nets de la session, null s'ils ne sont connus pour aucune game. */
  lp: number | null
  rating: number | null
}

export interface GameRecord {
  matchId: string
  championName: string
  durationSeconds: number
  win: boolean
  startedAt: number
}

export interface GrindStats {
  hours: number
  activeDays: number
  sessions: number
  longestSession: SessionRecord | null
  busiestDay: WinRecord | null
  bySessionGame: WinRecord[]
  afterWin: WinRecord
  afterLoss: WinRecord
  afterTwoLosses: WinRecord
  byWeekday: WinRecord[]
  longestGame: GameRecord | null
  shortestGame: GameRecord | null
  winDuration: number | null
  lossDuration: number | null
  /** Un par jour joué (clé AAAA-MM-JJ), du plus ancien au plus récent. */
  calendar: WinRecord[]
  recentSessions: SessionRecord[]
  /** Selon la pause avant la game : short (< 5 min), medium (5–15), long (15–45). */
  byBreak: WinRecord[]
  routine: WinRecord
  noRoutine: WinRecord
  afterTwoLossesLp: number | null
  /** LP moyens d'une victoire, puis d'une défaite (négatif), sur les games aux LP connus. */
  lpGain: number | null
  lpLoss: number | null
  /** Dernière game d'une session avant que le winrate passe sous 50 %. */
  stopAfter: number | null
  /** Selon la durée : lt25, 25-30, 30-35, gt35 (minutes). */
  byDuration: WinRecord[]
  /** Les 3 champions les plus joués de la période. */
  mains: string[]
  /** Dernières semaines jouées, de la plus ancienne à la plus récente. */
  pool: PoolWeek[]
}

export interface PoolWeek {
  /** Lundi de la semaine, AAAA-MM-JJ. */
  week: string
  games: number
  mainGames: number
  champions: number
}

/** Le joueur suivi face aux seuils GM et Challenger d'EUW. */
export interface Climb {
  tier: string | null
  leaguePoints: number | null
  challenger: number | null
  grandmaster: number | null
  /** LP par jour sur la dernière semaine de relevés. */
  lpPerDay: number | null
}

export interface PlayerStats {
  games: number
  wins: number
  kills: number
  deaths: number
  assists: number
  rating: number
  mvp: number
  ace: number
  champions: ChampionStats[]
  matchups: MatchupStats[]
  diffs: DiffStats[]
  jungle: JungleStats
  objectives: ObjectiveStats[]
  heatmap: Heatmap
  form: FormStats
  grind: GrindStats
  progress: ProgressPoint[]
}

/** Une game sur les courbes de progression, dans l'ordre chronologique. */
export interface ProgressPoint {
  matchId: string
  t: number
  win: boolean
  rating: number
  kda: number
  csPerMinute: number
  lpChange: number | null
}

export interface StatsFilters {
  champion?: string
  days?: number
}
