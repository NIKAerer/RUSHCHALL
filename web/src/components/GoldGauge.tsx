import type { ReactNode } from 'react'
import type { GoldPoint, JunglerPath } from '../api/types'
import { formatNumber } from '../lib/format'
import { ChampionIcon } from './GameIcons'
import styles from './GoldGauge.module.css'

/** Écart au-delà duquel la jauge est pleine. */
const TEAM_SCALE = 8000
const JUNGLER_SCALE = 2500

/**
 * Jauges d'or à l'instant lu (équipes, puis junglers) et courbe de l'écart sur toute la game,
 * avec le curseur de lecture. Un clic sur la courbe y amène la lecture.
 */
export function GoldGauge({
  gold,
  junglers,
  until,
  duration,
  onSeek,
}: {
  gold: GoldPoint[]
  junglers: JunglerPath[]
  until: number
  duration: number
  onSeek: (t: number) => void
}) {
  if (gold.length < 2) return null
  const now = goldAt(gold, until)
  const [ally, enemy] = [junglers.find((j) => j.isTrackedPlayer) ?? junglers[0], junglers.find((j) => !j.isTrackedPlayer)]

  return (
    <div className={styles.gold}>
      <Gauge label="Équipes" diff={now.ally - now.enemy} scale={TEAM_SCALE} />
      {now.allyJungler !== null && now.enemyJungler !== null && (
        <Gauge
          label="Junglers"
          diff={now.allyJungler - now.enemyJungler}
          scale={JUNGLER_SCALE}
          left={ally && <ChampionIcon championName={ally.championName} size={18} />}
          right={enemy && <ChampionIcon championName={enemy.championName} size={18} />}
        />
      )}
      <DiffCurve gold={gold} until={until} duration={duration} onSeek={onSeek} />
    </div>
  )
}

function Gauge({ label, diff, scale, left, right }: { label: string; diff: number; scale: number; left?: ReactNode; right?: ReactNode }) {
  const share = Math.min(Math.abs(diff) / scale, 1) * 50
  const ahead = diff >= 0
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.end}>{left}</span>
      <span className={styles.bar} role="meter" aria-label={`Écart d'or ${label.toLowerCase()}`} aria-valuenow={diff}>
        <span className={styles.fill} data-ahead={ahead || undefined} style={{ width: `${share}%`, [ahead ? 'right' : 'left']: '50%' }} />
        <span className={styles.middle} />
      </span>
      <span className={styles.end}>{right}</span>
      <span className={styles.value} data-ahead={ahead || undefined}>
        {diff === 0 ? '=' : `${ahead ? '+' : '−'}${formatNumber(Math.abs(Math.round(diff / 10) * 10))}`}
      </span>
    </div>
  )
}

const WIDTH = 300
const HEIGHT = 44

/** Écart d'or des équipes minute par minute : bleu quand ton équipe mène, rouge sinon. */
function DiffCurve({ gold, until, duration, onSeek }: { gold: GoldPoint[]; until: number; duration: number; onSeek: (t: number) => void }) {
  const max = Math.max(1000, ...gold.map((g) => Math.abs(g.ally - g.enemy)))
  const x = (t: number) => (t / duration) * WIDTH
  const y = (diff: number) => HEIGHT / 2 - (diff / max) * (HEIGHT / 2 - 2)
  const points = gold.map((g) => `L${x(g.t).toFixed(1)},${y(g.ally - g.enemy).toFixed(1)}`).join(' ')
  const area = `M0,${HEIGHT / 2} ${points} L${x(gold[gold.length - 1].t).toFixed(1)},${HEIGHT / 2} Z`

  return (
    <svg
      className={styles.curve}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Courbe de l'écart d'or entre les équipes"
      onClick={(e) => {
        const box = e.currentTarget.getBoundingClientRect()
        onSeek(Math.round(((e.clientX - box.left) / box.width) * duration))
      }}
    >
      <defs>
        <clipPath id="gold-above">
          <rect width={WIDTH} height={HEIGHT / 2} />
        </clipPath>
        <clipPath id="gold-below">
          <rect y={HEIGHT / 2} width={WIDTH} height={HEIGHT / 2} />
        </clipPath>
      </defs>
      <path d={area} className={styles.areaAhead} clipPath="url(#gold-above)" />
      <path d={area} className={styles.areaBehind} clipPath="url(#gold-below)" />
      <line x1={0} x2={WIDTH} y1={HEIGHT / 2} y2={HEIGHT / 2} className={styles.zero} />
      <line x1={x(until)} x2={x(until)} y1={0} y2={HEIGHT} className={styles.cursor} />
    </svg>
  )
}

/** Gold à l'instant `t`, entre les deux relevés de minute qui l'encadrent. */
function goldAt(gold: GoldPoint[], t: number): GoldPoint {
  const next = gold.findIndex((g) => g.t >= t)
  if (next <= 0) return next === 0 ? gold[0] : gold[gold.length - 1]
  const [a, b] = [gold[next - 1], gold[next]]
  const ratio = (t - a.t) / (b.t - a.t)
  const mix = (from: number | null, to: number | null) => (from === null || to === null ? null : from + (to - from) * ratio)
  return { t, ally: mix(a.ally, b.ally)!, enemy: mix(a.enemy, b.enemy)!, allyJungler: mix(a.allyJungler, b.allyJungler), enemyJungler: mix(a.enemyJungler, b.enemyJungler) }
}
