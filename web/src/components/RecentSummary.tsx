import type { MatchSummary } from '../api/types'
import { formatDecimal, formatPercent, kdaRatio } from '../lib/format'
import { ChampionIcon } from './GameIcons'
import { useChampion } from '../ddragon/useStaticData'
import styles from './RecentSummary.module.css'

interface ChampionStats {
  championName: string
  games: number
  wins: number
  kills: number
  deaths: number
  assists: number
}

/** Bilan des games chargées (hors remakes). */
export function RecentSummary({ matches }: { matches: MatchSummary[] }) {
  const games = matches.filter((m) => !m.remake)
  if (games.length === 0) return null

  const wins = games.filter((m) => m.player.win).length
  const sum = (pick: (m: MatchSummary) => number) => games.reduce((total, m) => total + pick(m), 0)
  const kills = sum((m) => m.player.kills)
  const deaths = sum((m) => m.player.deaths)
  const assists = sum((m) => m.player.assists)
  const kp = sum((m) => m.player.killParticipation) / games.length

  const byChampion = new Map<string, ChampionStats>()
  for (const { player } of games) {
    const stats = byChampion.get(player.championName) ?? { championName: player.championName, games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 }
    stats.games++
    stats.wins += Number(player.win)
    stats.kills += player.kills
    stats.deaths += player.deaths
    stats.assists += player.assists
    byChampion.set(player.championName, stats)
  }
  const topChampions = [...byChampion.values()].sort((a, b) => b.games - a.games || b.wins - a.wins).slice(0, 3)
  const ratio = wins / games.length

  return (
    <section className={styles.summary} aria-label={`Bilan des ${games.length} dernières games`}>
      <div className={styles.block}>
        <div className={styles.ring} style={{ ['--ratio' as string]: ratio }}>
          <span>{formatPercent(ratio)}</span>
        </div>
        <div>
          <div className={styles.label}>{games.length} dernières games</div>
          <div className={styles.big}>
            {wins}V {games.length - wins}D
          </div>
        </div>
      </div>
      <div className={styles.block}>
        <div>
          <div className={styles.label}>KDA moyen</div>
          <div className={styles.big}>{kdaRatio(kills, deaths, assists)}</div>
          <div className={styles.sub}>
            {formatDecimal(kills / games.length)} / {formatDecimal(deaths / games.length)} / {formatDecimal(assists / games.length)} · {formatPercent(kp)} KP
          </div>
        </div>
      </div>
      <div className={`${styles.block} ${styles.champions}`}>
        {topChampions.map((c) => (
          <ChampionLine key={c.championName} stats={c} />
        ))}
      </div>
    </section>
  )
}

function ChampionLine({ stats }: { stats: ChampionStats }) {
  const { name } = useChampion(stats.championName)
  return (
    <div className={styles.champion}>
      <ChampionIcon championName={stats.championName} size={28} />
      <span className={styles.champName}>{name}</span>
      <span className={stats.wins / stats.games >= 0.5 ? styles.good : styles.sub}>{formatPercent(stats.wins / stats.games)}</span>
      <span className={styles.sub}>
        {stats.wins}V {stats.games - stats.wins}D
      </span>
      <span className={styles.sub}>{kdaRatio(stats.kills, stats.deaths, stats.assists)} KDA</span>
    </div>
  )
}
