import type { ChampionStats, StatsFilters as Filters } from '../../api/types'
import { useChampion } from '../../ddragon/useStaticData'
import { ChampionIcon } from '../GameIcons'
import styles from './StatsFilters.module.css'

const PERIODS: { days: number | undefined; label: string }[] = [
  { days: undefined, label: 'Tout' },
  { days: 30, label: '30 j' },
  { days: 7, label: '7 j' },
]

/** Champions proposés dans le filtre : les plus joués sur la période. */
const CHAMPIONS_SHOWN = 10

export function StatsFilters({ filters, champions, onChange }: { filters: Filters; champions: ChampionStats[]; onChange: (filters: Filters) => void }) {
  return (
    <div className={styles.filters}>
      <div className={styles.group} role="group" aria-label="Période">
        {PERIODS.map(({ days, label }) => (
          <button key={label} type="button" aria-pressed={filters.days === days} onClick={() => onChange({ ...filters, days })}>
            {label}
          </button>
        ))}
      </div>
      <div className={styles.group} role="group" aria-label="Champion">
        <button type="button" aria-pressed={!filters.champion} onClick={() => onChange({ ...filters, champion: undefined })}>
          Tous
        </button>
        {champions.slice(0, CHAMPIONS_SHOWN).map((c) => (
          <ChampionFilter
            key={c.championName}
            champion={c}
            selected={filters.champion === c.championName}
            onSelect={() => onChange({ ...filters, champion: filters.champion === c.championName ? undefined : c.championName })}
          />
        ))}
      </div>
    </div>
  )
}

function ChampionFilter({ champion, selected, onSelect }: { champion: ChampionStats; selected: boolean; onSelect: () => void }) {
  const { name } = useChampion(champion.championName)
  return (
    <button type="button" className={styles.champion} aria-pressed={selected} title={`${name} · ${champion.games} games`} onClick={onSelect}>
      <ChampionIcon championName={champion.championName} size={28} />
    </button>
  )
}
