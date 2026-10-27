import { useState } from 'react'
import type { MatchupStats } from '../../api/types'
import { useChampion } from '../../ddragon/useStaticData'
import { formatSigned } from '../../lib/format'
import { ChampionIcon } from '../GameIcons'
import { toneOf } from './tone'
import { WinRate } from './WinRate'
import styles from './MatchupsPanel.module.css'
import common from './stats.module.css'

/** Lignes par liste de favorables / difficiles. */
const SHORTLIST = 6

const ratio = (m: MatchupStats) => m.wins / m.games

/** Adversaires directs : favorables et difficiles côte à côte pour la draft, puis la liste complète triable. */
export function MatchupsPanel({ matchups }: { matchups: MatchupStats[] }) {
  const [all, setAll] = useState(false)
  const known = matchups.filter((m) => m.games >= 2)
  const good = known.filter((m) => ratio(m) >= 0.6).sort((a, b) => ratio(b) - ratio(a) || b.games - a.games)
  const hard = known.filter((m) => ratio(m) < 0.5).sort((a, b) => ratio(a) - ratio(b) || b.games - a.games)

  return (
    <section className={common.panel}>
      <h2 className={common.title}>
        Adversaires directs <small>2 games minimum</small>
      </h2>
      <div className={styles.split}>
        <div>
          <h3 className={`${styles.listTitle} ${common.good}`}>Favorables</h3>
          <MatchupTable matchups={good.slice(0, SHORTLIST)} sortable={false} />
        </div>
        <div>
          <h3 className={`${styles.listTitle} ${common.bad}`}>Difficiles</h3>
          <MatchupTable matchups={hard.slice(0, SHORTLIST)} sortable={false} />
        </div>
      </div>
      <button type="button" className={styles.more} aria-expanded={all} onClick={() => setAll((a) => !a)}>
        {all ? 'Masquer la liste complète' : `Tous les adversaires (${matchups.length})`}
      </button>
      {all && <FullMatchups matchups={matchups} />}
    </section>
  )
}

/** Liste complète, triable, avec ou sans les adversaires croisés une seule fois. */
export function FullMatchups({ matchups }: { matchups: MatchupStats[] }) {
  const [singles, setSingles] = useState(false)
  const shown = singles ? matchups : matchups.filter((m) => m.games >= 2)
  const hidden = matchups.length - shown.length

  return (
    <div className={styles.full}>
      <MatchupTable matchups={shown} sortable />
      {(hidden > 0 || singles) && (
        <label className={styles.singles}>
          <input type="checkbox" checked={singles} onChange={(event) => setSingles(event.target.checked)} />
          Inclure les adversaires à 1 game{hidden > 0 && ` (${hidden})`}
        </label>
      )}
    </div>
  )
}

type SortKey = 'games' | 'winrate' | 'gold'

const SORTS: Record<SortKey, (m: MatchupStats) => number> = {
  games: (m) => m.games,
  winrate: ratio,
  gold: (m) => m.goldDiffAt15 ?? -Infinity,
}

function MatchupTable({ matchups, sortable }: { matchups: MatchupStats[]; sortable: boolean }) {
  const [sort, setSort] = useState<SortKey>('games')
  if (matchups.length === 0) return <p className={common.empty}>Aucun adversaire.</p>

  const rows = sortable ? [...matchups].sort((a, b) => SORTS[sort](b) - SORTS[sort](a) || b.games - a.games) : matchups
  const header = (key: SortKey, label: string) =>
    sortable ? (
      <th scope="col" aria-sort={sort === key ? 'descending' : undefined}>
        <button type="button" onClick={() => setSort(key)}>
          {label}
          {sort === key && ' ↓'}
        </button>
      </th>
    ) : (
      <th scope="col">{label}</th>
    )

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th scope="col" className={styles.left}>
            Champion
          </th>
          {header('games', 'Games')}
          {header('winrate', 'Winrate')}
          {header('gold', 'Gold@15')}
        </tr>
      </thead>
      <tbody>
        {rows.map((m) => (
          <MatchupRow key={m.opponent} matchup={m} />
        ))}
      </tbody>
    </table>
  )
}

function MatchupRow({ matchup }: { matchup: MatchupStats }) {
  const { name } = useChampion(matchup.opponent)

  return (
    <tr>
      <td className={styles.left}>
        <span className={styles.champion}>
          <ChampionIcon championName={matchup.opponent} size={24} />
          <span>{name}</span>
        </span>
      </td>
      <td>{matchup.games}</td>
      <td className={styles.wr}>
        <WinRate games={matchup.games} wins={matchup.wins} />
      </td>
      <td className={toneOf(matchup.goldDiffAt15)}>{matchup.goldDiffAt15 === null ? '—' : formatSigned(matchup.goldDiffAt15)}</td>
    </tr>
  )
}
