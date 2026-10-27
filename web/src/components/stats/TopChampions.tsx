import type { ChampionStats } from '../../api/types'
import { useChampion } from '../../ddragon/useStaticData'
import { formatPercent, kdaRatio } from '../../lib/format'
import { ChampionIcon } from '../GameIcons'
import { kdaTone, winrateTone } from './tone'
import styles from './TopChampions.module.css'
import common from './stats.module.css'

const SHOWN = 6

/** Les champions les plus joués en cartes : icône, winrate en grand, anneau victoires / défaites. */
export function TopChampions({ champions }: { champions: ChampionStats[] }) {
  return (
    <section className={common.panel}>
      <h2 className={common.title}>Champions les plus joués</h2>
      <div className={styles.grid}>
        {champions.slice(0, SHOWN).map((c) => (
          <ChampionCard key={c.championName} champion={c} />
        ))}
      </div>
    </section>
  )
}

function ChampionCard({ champion }: { champion: ChampionStats }) {
  const { name } = useChampion(champion.championName)
  const ratio = champion.wins / champion.games
  const kda = (champion.kills + champion.assists) / Math.max(1, champion.deaths)

  return (
    <div className={styles.card}>
      <div className={styles.portrait} style={{ ['--ratio' as string]: ratio }}>
        <ChampionIcon championName={champion.championName} size={46} />
      </div>
      <span className={styles.name}>{name}</span>
      <b className={`${styles.wr} ${winrateTone(ratio) ?? ''}`}>{formatPercent(ratio)}</b>
      <span className={common.sub}>
        {champion.wins}V {champion.games - champion.wins}D
      </span>
      <span className={`${styles.kda} ${kdaTone(kda) ?? ''}`}>{kdaRatio(champion.kills, champion.deaths, champion.assists)} KDA</span>
    </div>
  )
}
