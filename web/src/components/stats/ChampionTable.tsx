import { Fragment, useState } from 'react'
import type { ChampionStats, MatchupStats } from '../../api/types'
import { useChampion } from '../../ddragon/useStaticData'
import { formatDecimal, formatNumber, formatSigned, kdaRatio } from '../../lib/format'
import { ChampionIcon } from '../GameIcons'
import { toneOf } from './tone'
import { WinRate } from './WinRate'
import styles from './ChampionTable.module.css'
import common from './stats.module.css'

/** Stats par champion ; un clic ouvre ses matchups contre l'adversaire au même poste. */
export function ChampionTable({ champions }: { champions: ChampionStats[] }) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <section className={common.panel}>
      <h2 className={common.title}>Champions</h2>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.left}>
                Champion
              </th>
              <th scope="col" className={styles.left}>
                Winrate
              </th>
              <th scope="col">KDA</th>
              <th scope="col">CS/min</th>
              <th scope="col">Gold@15</th>
              <th scope="col">Note</th>
            </tr>
          </thead>
          <tbody>
            {champions.map((champion) => (
              <Fragment key={champion.championName}>
                <ChampionRow
                  champion={champion}
                  open={open === champion.championName}
                  onToggle={() => setOpen((o) => (o === champion.championName ? null : champion.championName))}
                />
                {open === champion.championName && (
                  <tr className={styles.matchupsRow}>
                    <td colSpan={6}>
                      <Matchups matchups={champion.matchups} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ChampionRow({ champion, open, onToggle }: { champion: ChampionStats; open: boolean; onToggle: () => void }) {
  const { name } = useChampion(champion.championName)

  return (
    <tr className={styles.row}>
      <td className={styles.left}>
        <button type="button" className={styles.champion} aria-expanded={open} onClick={onToggle}>
          <ChampionIcon championName={champion.championName} size={32} />
          <span>{name}</span>
        </button>
      </td>
      <td className={styles.left}>
        <WinRate games={champion.games} wins={champion.wins} />
      </td>
      <td>
        <div className={styles.main}>{kdaRatio(champion.kills, champion.deaths, champion.assists)}</div>
        <div className={common.sub}>
          {formatDecimal(champion.kills)}/{formatDecimal(champion.deaths)}/{formatDecimal(champion.assists)}
        </div>
      </td>
      <td className={styles.main}>{formatDecimal(champion.csPerMinute)}</td>
      <td className={styles.main}>{champion.goldAt15 === null ? '—' : formatNumber(champion.goldAt15)}</td>
      <td className={styles.main}>{formatDecimal(champion.rating)}</td>
    </tr>
  )
}

/** Adversaires au même poste : icône, winrate et écart de gold moyen à 15 minutes. */
export function Matchups({ matchups }: { matchups: MatchupStats[] }) {
  if (matchups.length === 0) return <p className={common.empty}>Aucun adversaire connu.</p>

  return (
    <ul className={styles.matchups}>
      {matchups.map((m) => (
        <MatchupChip key={m.opponent} matchup={m} />
      ))}
    </ul>
  )
}

function MatchupChip({ matchup }: { matchup: MatchupStats }) {
  const { name } = useChampion(matchup.opponent)
  const ratio = matchup.wins / matchup.games

  return (
    <li className={styles.matchup} title={`Contre ${name} : ${matchup.wins}V ${matchup.games - matchup.wins}D`}>
      <ChampionIcon championName={matchup.opponent} size={28} />
      <span className={ratio >= 0.5 ? common.good : common.bad}>{Math.round(ratio * 100)}%</span>
      <span className={common.sub}>{matchup.games}</span>
      {matchup.goldDiffAt15 !== null && (
        <span className={`${styles.diff} ${toneOf(matchup.goldDiffAt15) ?? ''}`} title="Écart de gold moyen à 15 min">
          {formatSigned(matchup.goldDiffAt15)}
        </span>
      )}
    </li>
  )
}
