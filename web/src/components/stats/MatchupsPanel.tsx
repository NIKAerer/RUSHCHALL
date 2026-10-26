import type { MatchupStats } from '../../api/types'
import { Matchups } from './ChampionTable'
import common from './stats.module.css'

export function MatchupsPanel({ matchups }: { matchups: MatchupStats[] }) {
  return (
    <section className={common.panel}>
      <h2 className={common.title}>
        Adversaires directs <small>winrate · games · gold@15</small>
      </h2>
      <Matchups matchups={matchups} />
    </section>
  )
}
