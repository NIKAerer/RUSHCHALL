import { useState, type PointerEvent } from 'react'
import type { FormStats, LpPoint, WinRecord } from '../../api/types'
import { formatPercent, formatSigned } from '../../lib/format'
import { tierLabel } from '../../lib/riot'
import styles from './LpAndHours.module.css'
import common from './stats.module.css'

const date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export function HourPanel({ form }: { form: FormStats }) {
  return (
    <section className={common.panel}>
      <h2 className={common.title}>
        Winrate par heure <small>heure de début</small>
      </h2>
      <HourChart hours={form.byHour} />
    </section>
  )
}

const WIDTH = 300
const HEIGHT = 110
const PAD = 8

/** Courbe de LP de la période ; le rang et la date du relevé n'apparaissent qu'au survol. */
export function LpChart({ points }: { points: LpPoint[] }) {
  const [hover, setHover] = useState<number | null>(null)
  if (points.length < 2) {
    return <p className={common.empty}>La courbe se remplit à chaque ouverture du site.</p>
  }

  const [t0, t1] = [points[0].t, points[points.length - 1].t]
  const ladders = points.map((p) => p.ladder)
  const [low, high] = [Math.min(...ladders) - 20, Math.max(...ladders) + 20]
  const x = (t: number) => PAD + ((t - t0) / (t1 - t0 || 1)) * (WIDTH - PAD * 2)
  const y = (ladder: number) => PAD + (1 - (ladder - low) / (high - low)) * (HEIGHT - PAD * 2)
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t).toFixed(1)} ${y(p.ladder).toFixed(1)}`).join(' ')
  const last = points[points.length - 1]
  const shown = hover === null ? last : points[hover]
  const delta = last.ladder - points[0].ladder

  const onMove = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const t = t0 + ((event.clientX - box.left) / box.width) * (t1 - t0)
    let nearest = 0
    points.forEach((p, i) => {
      if (Math.abs(p.t - t) < Math.abs(points[nearest].t - t)) nearest = i
    })
    setHover(nearest)
  }

  return (
    <div className={styles.lp}>
      <div className={styles.lpHead} style={hover === null ? { visibility: 'hidden' } : undefined}>
        <span className={styles.lpValue}>
          {tierLabel(shown.tier, shown.division)} <b>{shown.leaguePoints} LP</b>
        </span>
        <span className={delta >= 0 ? common.good : common.bad}>{formatSigned(delta)}</span>
        <span className={common.sub}>{date.format(shown.t)}</span>
      </div>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Courbe de LP : ${formatSigned(delta)} LP sur la période`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <path d={`${line} L${x(t1)} ${HEIGHT} L${x(t0)} ${HEIGHT} Z`} className={styles.area} />
        <path d={line} className={styles.line} vectorEffect="non-scaling-stroke" />
        {hover !== null && <line x1={x(shown.t)} x2={x(shown.t)} y1={0} y2={HEIGHT} className={styles.cross} vectorEffect="non-scaling-stroke" />}
      </svg>
    </div>
  )
}

function HourChart({ hours }: { hours: WinRecord[] }) {
  const most = Math.max(1, ...hours.map((h) => h.games))

  return (
    <div className={styles.hours}>
      {hours.map((h) => {
        const ratio = h.games === 0 ? 0 : h.wins / h.games
        return (
          <div key={h.key} className={styles.hour} title={h.games === 0 ? `${h.key}h : aucune game` : `${h.key}h : ${h.wins}V ${h.games - h.wins}D · ${formatPercent(ratio)}`}>
            <div className={styles.column}>
              {h.games > h.wins && <span className={styles.losses} style={{ height: `${((h.games - h.wins) / most) * 100}%` }} />}
              {h.wins > 0 && <span className={styles.wins} style={{ height: `${(h.wins / most) * 100}%` }} />}
            </div>
            <span className={styles.hourLabel}>{Number(h.key) % 3 === 0 ? `${h.key}h` : ''}</span>
          </div>
        )
      })}
    </div>
  )
}
