import { useSearchParams } from 'react-router-dom'
import { useStats } from '../api/queries'
import type { PlayerStats, StatsFilters as Filters } from '../api/types'
import { ErrorState } from '../components/ErrorState'
import { ChampionTable } from '../components/stats/ChampionTable'
import { GrindPanel } from '../components/stats/GrindPanel'
import { HeatmapPanel } from '../components/stats/HeatmapPanel'
import { JunglePanel } from '../components/stats/JunglePanel'
import { LaneDiffs } from '../components/stats/LaneDiffs'
import { HourPanel, LpCard } from '../components/stats/LpAndHours'
import { MatchupsPanel } from '../components/stats/MatchupsPanel'
import { ObjectivesPanel } from '../components/stats/ObjectivesPanel'
import { StatsFilters } from '../components/stats/StatsFilters'
import { SummaryCard } from '../components/stats/SummaryCard'
import styles from './StatsPage.module.css'

const TABS = [
  { id: 'overview', label: 'Aperçu' },
  { id: 'champions', label: 'Champions' },
  { id: 'jungle', label: 'Jungle' },
  { id: 'grind', label: 'Grind' },
] as const

type Tab = (typeof TABS)[number]['id']

/** Stats sur toutes les games Solo/Duo en base : bilan à gauche, détail par onglet à droite, comme dpm.lol. */
export function StatsPage() {
  // Les filtres et l'onglet vivent dans l'URL : on peut recharger ou partager la page.
  const [params, setParams] = useSearchParams()
  const filters: Filters = { champion: params.get('champion') ?? undefined, days: Number(params.get('days')) || undefined }
  const tab: Tab = TABS.find((t) => t.id === params.get('tab'))?.id ?? 'overview'
  const update = (next: Filters & { tab?: Tab }) =>
    setParams(Object.fromEntries(Object.entries(next).filter(([key, value]) => value !== undefined && !(key === 'tab' && value === 'overview')).map(([key, value]) => [key, String(value)])), {
      replace: true,
    })

  // Les champions du filtre viennent de la période seule, pour pouvoir passer de l'un à l'autre.
  const period = useStats({ days: filters.days })
  const { data, isPending, isError, error, isPlaceholderData } = useStats(filters)

  if (isPending) return <div className={styles.skeleton} aria-busy="true" />
  if (isError) return <ErrorState title="Impossible de charger les stats" message={error.message} />

  return (
    <div className={styles.page} aria-busy={isPlaceholderData}>
      <StatsFilters filters={filters} champions={period.data?.champions ?? []} onChange={(next) => update({ ...next, tab })} />
      {data.games === 0 ? (
        <p className={styles.empty}>Aucune game sur cette période.</p>
      ) : (
        <div className={styles.layout}>
          <aside className={styles.aside}>
            <SummaryCard stats={data} />
            <LpCard form={data.form} />
          </aside>
          <div className={styles.content}>
            <nav className={styles.tabs} role="tablist" aria-label="Sections">
              {TABS.map((t) => (
                <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => update({ ...filters, tab: t.id })}>
                  {t.label}
                </button>
              ))}
            </nav>
            <TabContent tab={tab} data={data} />
          </div>
        </div>
      )}
    </div>
  )
}

function TabContent({ tab, data }: { tab: Tab; data: PlayerStats }) {
  switch (tab) {
    case 'champions':
      return (
        <>
          <ChampionTable champions={data.champions} />
          <MatchupsPanel matchups={data.matchups} />
        </>
      )
    case 'jungle':
      return (
        <div className={styles.columns}>
          <JunglePanel jungle={data.jungle} />
          <HeatmapPanel heatmap={data.heatmap} />
        </div>
      )
    case 'grind':
      return <GrindPanel grind={data.grind} games={data.games} />
    default:
      return (
        <>
          <LaneDiffs diffs={data.diffs} />
          <div className={styles.columns}>
            <ObjectivesPanel objectives={data.objectives} />
            <HourPanel form={data.form} />
          </div>
        </>
      )
  }
}
