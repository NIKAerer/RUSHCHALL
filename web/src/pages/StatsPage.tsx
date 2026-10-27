import { useSearchParams } from 'react-router-dom'
import { useStats } from '../api/queries'
import type { StatsFilters as Filters, PlayerStats } from '../api/types'
import { ErrorState } from '../components/ErrorState'
import { ChampionTable } from '../components/stats/ChampionTable'
import { FormPanel } from '../components/stats/FormPanel'
import { GrindPanel } from '../components/stats/GrindPanel'
import { HeatmapPanel } from '../components/stats/HeatmapPanel'
import { JunglePanel } from '../components/stats/JunglePanel'
import { LaneDiffs } from '../components/stats/LaneDiffs'
import { MatchupsPanel } from '../components/stats/MatchupsPanel'
import { ObjectivesPanel } from '../components/stats/ObjectivesPanel'
import { Overview } from '../components/stats/Overview'
import { StatsFilters } from '../components/stats/StatsFilters'
import styles from './StatsPage.module.css'

/** Stats sur toutes les games Solo/Duo en base. */
export function StatsPage() {
  // Les filtres vivent dans l'URL : on peut recharger ou partager la page filtrée.
  const [params, setParams] = useSearchParams()
  const filters: Filters = { champion: params.get('champion') ?? undefined, days: Number(params.get('days')) || undefined }
  const setFilters = (next: Filters) =>
    setParams(Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])), { replace: true })

  // Les champions du filtre viennent de la période seule, pour pouvoir passer de l'un à l'autre.
  const period = useStats({ days: filters.days })
  const { data, isPending, isError, error, isPlaceholderData } = useStats(filters)

  if (isPending) return <div className={styles.skeleton} aria-busy="true" />
  if (isError) return <ErrorState title="Impossible de charger les stats" message={error.message} />

  return (
    <div className={styles.page} aria-busy={isPlaceholderData}>
      <StatsFilters filters={filters} champions={period.data?.champions ?? []} onChange={setFilters} />
      {data.games === 0 ? <p className={styles.empty}>Aucune game sur cette période.</p> : <StatsContent data={data} />}
    </div>
  )
}

function StatsContent({ data }: { data: PlayerStats }) {
  return (
    <>
      <Overview stats={data} />
      <div className={styles.columns}>
        <ChampionTable champions={data.champions} />
        <FormPanel form={data.form} />
      </div>
      <div className={styles.columns}>
        <LaneDiffs diffs={data.diffs} />
        <MatchupsPanel matchups={data.matchups} />
      </div>
      <div className={styles.thirds}>
        <JunglePanel jungle={data.jungle} />
        <ObjectivesPanel objectives={data.objectives} />
        <HeatmapPanel heatmap={data.heatmap} />
      </div>
      <GrindPanel grind={data.grind} games={data.games} />
    </>
  )
}
