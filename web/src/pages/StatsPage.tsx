import { useStats } from '../api/queries'
import { ErrorState } from '../components/ErrorState'
import { ChampionTable } from '../components/stats/ChampionTable'
import { FormPanel } from '../components/stats/FormPanel'
import { HeatmapPanel } from '../components/stats/HeatmapPanel'
import { JunglePanel } from '../components/stats/JunglePanel'
import { LaneDiffs } from '../components/stats/LaneDiffs'
import { MatchupsPanel } from '../components/stats/MatchupsPanel'
import { ObjectivesPanel } from '../components/stats/ObjectivesPanel'
import { Overview } from '../components/stats/Overview'
import styles from './StatsPage.module.css'

/** Stats sur toutes les games Solo/Duo en base. */
export function StatsPage() {
  const { data, isPending, isError, error } = useStats()

  if (isPending) return <div className={styles.skeleton} aria-busy="true" />
  if (isError) return <ErrorState title="Impossible de charger les stats" message={error.message} />
  if (data.games === 0) return <p className={styles.empty}>Aucune game en base pour l'instant.</p>

  return (
    <div className={styles.page}>
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
    </div>
  )
}
