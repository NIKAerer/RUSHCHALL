import type { FormStats } from '../../api/types'
import styles from './FormLine.module.css'
import common from './stats.module.css'

const WIDTH = 400
const HEIGHT = 200
const PAD = 10

/** Courbe de forme : +1 par victoire, −1 par défaite, sur les dernières games. */
export function FormLine({ form }: { form: FormStats }) {
  const steps = form.recent.reduce<number[]>((acc, win) => [...acc, (acc[acc.length - 1] ?? 0) + (win ? 1 : -1)], [0])
  const extent = Math.max(2, ...steps.map(Math.abs))
  const x = (i: number) => PAD + (i / Math.max(1, steps.length - 1)) * (WIDTH - PAD * 2)
  const y = (v: number) => HEIGHT / 2 - (v / extent) * (HEIGHT / 2 - PAD)
  const path = steps.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const net = steps[steps.length - 1]
  const wins = form.recent.filter(Boolean).length

  return (
    <section className={common.panel}>
      <h2 className={common.title}>
        Forme <small>{form.recent.length} dernières games</small>
      </h2>
      <div className={styles.head}>
        <b className={net >= 0 ? common.good : common.bad}>
          {net > 0 ? '+' : ''}
          {net}
        </b>
        <span className={common.sub}>
          {wins}V {form.recent.length - wins}D
        </span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.chart} role="img" aria-label={`Bilan net ${net} sur les dernières games`}>
        <line x1={PAD} x2={WIDTH - PAD} y1={HEIGHT / 2} y2={HEIGHT / 2} className={styles.zero} />
        <path d={`${path} L${x(steps.length - 1)} ${HEIGHT / 2} L${x(0)} ${HEIGHT / 2} Z`} className={net >= 0 ? styles.areaUp : styles.areaDown} />
        <path d={path} className={styles.line} />
        {form.recent.map((win, i) => (
          <circle key={i} cx={x(i + 1)} cy={y(steps[i + 1])} r={3.5} className={win ? styles.win : styles.loss}>
            <title>{win ? 'Victoire' : 'Défaite'}</title>
          </circle>
        ))}
      </svg>
    </section>
  )
}
