import type { MatchupStats } from '../../api/types'
import { useChampion } from '../../ddragon/useStaticData'
import { formatPercent } from '../../lib/format'
import { ChampionIcon } from '../GameIcons'
import { winrateTone } from './tone'
import styles from './MatchupsCard.module.css'
import common from './stats.module.css'

const ratio = (m: MatchupStats) => m.wins / m.games

/** Aperçu des adversaires directs : les deux plus favorables et les deux plus difficiles. */
export function MatchupsCard({ matchups, onShowAll }: { matchups: MatchupStats[]; onShowAll: () => void }) {
  const known = matchups.filter((m) => m.games >= 2).sort((a, b) => ratio(b) - ratio(a) || b.games - a.games)
  const picks = known.length <= 4 ? known : [...known.slice(0, 2), ...known.slice(-2)]

  return (
    <section className={common.panel}>
      <h2 className={common.title}>
        Adversaires directs
        <button type="button" className={styles.all} onClick={onShowAll}>
          Voir tout
        </button>
      </h2>
      {picks.length === 0 ? (
        <p className={common.empty}>Pas encore assez de games contre un même champion.</p>
      ) : (
        <div>
          {picks.map((m) => (
            <MatchupLine key={m.opponent} matchup={m} />
          ))}
        </div>
      )}
    </section>
  )
}

function MatchupLine({ matchup }: { matchup: MatchupStats }) {
  const { name } = useChampion(matchup.opponent)

  return (
    <div className={styles.line}>
      <ChampionIcon championName={matchup.opponent} size={32} />
      <span className={styles.name}>{name}</span>
      <span className={styles.games}>{matchup.games} games</span>
      <b className={winrateTone(ratio(matchup))}>{formatPercent(ratio(matchup))}</b>
    </div>
  )
}
