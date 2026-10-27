import type { FormStats } from '../../api/types'
import styles from './FormLine.module.css'
import common from './stats.module.css'

const WIDTH = 400
const HEIGHT = 200
const PAD = 10

/** Courbe de forme : +1 par victoire, −1 par défaite, sur les dernières games. */
export function FormLine({ form }: { form: FormStats }) {
  const steps = form.recent.reduce<number[]>((acc, win) => [...acc, (acc[acc.length - 1] ?? 0) + (win ? 1 : -1)], [0])
  // L'échelle suit la courbe (zéro compris) : une série positive occupe toute la hauteur, sans moitié vide.
  const [low, high] = [Math.min(0, ...steps) - 1, Math.max(0, ...steps) + 1]
  const x = (i: number) => PAD + (i / Math.max(1, steps.length - 1)) * (WIDTH - PAD * 2)
  const y = (v: number) => PAD + ((high - v) / (high - low)) * (HEIGHT - PAD * 2)
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
        <line x1={PAD} x2={WIDTH - PAD} y1={y(0)} y2={y(0)} className={styles.zero} />
        <path d={`${path} L${x(steps.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`} className={net >= 0 ? styles.areaUp : styles.areaDown} />
        <path d={path} className={styles.line} />
        {form.recent.map((win, i) => (
          <circle key={i} cx={x(i + 1)} cy={y(steps[i + 1])} r={3.5} className={win ? styles.win : styles.loss}>
            <title>{win ? 'Victoire' : 'Défaite'}</title>
          </circle>
        ))}
      </svg>
      <dl className={styles.records}>
        <div>
          <dt>Série en cours</dt>
          <dd className={form.streak > 0 ? common.good : form.streak < 0 ? common.bad : undefined}>
            {form.streak === 0 ? '—' : `${Math.abs(form.streak)}${form.streak > 0 ? 'V' : 'D'}`}
          </dd>
        </div>
        <div>
          <dt>Record V</dt>
          <dd className={common.good}>{form.longestWinStreak}</dd>
        </div>
        <div>
          <dt>Record D</dt>
          <dd className={common.bad}>{form.longestLossStreak}</dd>
        </div>
      </dl>
    </section>
  )
}
