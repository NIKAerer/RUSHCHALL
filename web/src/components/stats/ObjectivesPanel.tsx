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

/** Objectifs pris et perdus, avec l'écart de gold des équipes au moment du combat. */
export function ObjectivesPanel({ objectives }: { objectives: ObjectiveStats[] }) {
  return (
    <section className={common.panel}>
      <h2 className={common.title}>
        Objectifs <small>écart de gold au moment de l'objectif</small>
      </h2>
      <ul className={styles.list}>
        <li className={`${styles.objective} ${styles.head}`} aria-hidden="true">
          <span />
          <span />
          <span>pris</span>
          <span>perdu</span>
        </li>
        {objectives.filter((o) => o.taken + o.lost > 0).map((o) => {
          const total = o.taken + o.lost
          return (
            <li key={o.type} className={styles.objective}>
              <span className={styles.icon} title={LABELS[o.type]}>
                <ObjectiveIcon objective={o.type} />
              </span>
              <div className={styles.split} title={`${o.taken} pris, ${o.lost} perdus`}>
                <div className={styles.bar}>
                  {o.taken > 0 && <span className={styles.taken} style={{ flexGrow: o.taken }} />}
                  {o.lost > 0 && <span className={styles.lost} style={{ flexGrow: o.lost }} />}
                  {total === 0 && <span className={styles.none} />}
                </div>
                <div className={styles.counts}>
                  <span>
                    <b>{o.taken}</b> pris
                  </span>
                  <span>
                    <b>{o.lost}</b> perdus
                  </span>
                </div>
              </div>
              <Gold value={o.goldDiffTaken} title="Écart moyen quand ton équipe le prend" />
              <Gold value={o.goldDiffLost} title="Écart moyen quand l'adversaire le prend" />
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Gold({ value, title }: { value: number | null; title: string }) {
  return (
    <span className={`${styles.gold} ${toneOf(value) ?? ''}`} title={title}>
      {value === null ? '—' : formatSigned(value)}
    </span>
  )
}
