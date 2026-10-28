import type { ObjectiveStats } from '../../api/types'
import { formatSigned } from '../../lib/format'
import { ObjectiveIcon } from '../MomentFeed'
import { toneOf } from './tone'
import styles from './ObjectivesPanel.module.css'
import common from './stats.module.css'

const LABELS: Record<ObjectiveStats['type'], string> = {
  grubs: 'Larves',
  herald: 'Héraut',
  dragon: 'Drakes',
  atakhan: 'Atakhan',
  baron: 'Nashor',
}

const R = 30
const CIRCUMFERENCE = 2 * Math.PI * R

/** Un anneau par objectif (pris en vert, perdus en rouge) et l'écart de gold au moment du combat. */
export function ObjectivesPanel({ objectives }: { objectives: ObjectiveStats[] }) {
  const shown = objectives.filter((o) => o.taken + o.lost > 0)

  return (
    <section className={common.panel}>
      <h2 className={common.title}>
        Objectifs <small>gold d'équipe au moment de l'objectif</small>
      </h2>
      <div className={styles.grid}>
        {shown.map((o) => {
          const share = o.taken / (o.taken + o.lost)
          return (
            <div key={o.type} className={styles.objective}>
              <div className={styles.donut}>
                <svg viewBox="0 0 80 80" aria-hidden="true">
                  <circle cx="40" cy="40" r={R} className={styles.lost} />
                  <circle cx="40" cy="40" r={R} className={styles.taken} strokeDasharray={`${share * CIRCUMFERENCE} ${CIRCUMFERENCE}`} />
                </svg>
                <ObjectiveIcon objective={o.type} />
              </div>
              <span className={styles.name}>{LABELS[o.type]}</span>
              <span className={styles.score} title={`${o.taken} pris, ${o.lost} perdus`}>
                <b className={common.good}>{o.taken}</b>
                <span>–</span>
                <b className={common.bad}>{o.lost}</b>
              </span>
              <span className={styles.gold}>
                <span title="Écart moyen quand ton équipe le prend" className={toneOf(o.goldDiffTaken)}>
                  ▲ {o.goldDiffTaken === null ? '—' : formatSigned(o.goldDiffTaken)}
                </span>
                <span title="Écart moyen quand l'adversaire le prend" className={toneOf(o.goldDiffLost)}>
                  ▼ {o.goldDiffLost === null ? '—' : formatSigned(o.goldDiffLost)}
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
