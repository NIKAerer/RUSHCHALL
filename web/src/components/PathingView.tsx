import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathing } from '../api/queries'
import type { JunglePathing, JunglerPath, JunglerStats, Moment, Objective, PathPoint } from '../api/types'
import { mapImage } from '../ddragon/ddragon'
import { useChampion, useStaticData } from '../ddragon/useStaticData'
import { formatDuration, formatNumber } from '../lib/format'
import { ErrorState } from './ErrorState'
import { FirstClear } from './FirstClear'
import { ChampionIcon } from './GameIcons'
import { aheadOf } from '../lib/compare'
import { JunglerName, VersusTable, type VersusRow } from './Versus'
import styles from './PathingView.module.css'

/** Les coordonnées Riot vont de 0 à ~15 000, avec la base bleue en bas à gauche. */
const MAP_SIZE = 15000
const EARLY_GAME = 15 * 60

const COLORS = ['var(--path-ally)', 'var(--path-enemy)']

/** Au-delà de 5 minutes, la route s'est entièrement effacée : la carte reste propre. */
const TRAIL_SECONDS = 5 * 60

/** Secondes de jeu jouées par seconde réelle pendant la lecture. */
const SPEEDS = [15, 30, 60]

interface ListedMoment {
  key: string
  moment: Moment
  index: number
}

export function PathingView({ matchId }: { matchId: string }) {
  const { data, isPending, isError, error } = usePathing(matchId)

  if (isPending) return <p className={styles.loading}>Chargement du pathing…</p>
  if (isError) return <ErrorState title="Pathing indisponible" message={error.message} />
  if (data.junglers.length === 0) return <p className={styles.loading}>Aucun jungler identifié dans cette game.</p>

  return <Pathing pathing={data} />
}

function Pathing({ pathing }: { pathing: JunglePathing }) {
  const duration = pathing.durationSeconds
  const [until, setUntil] = useState(Math.min(EARLY_GAME, duration))
  const [hidden, setHidden] = useState<string[]>([])
  const [focused, setFocused] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(SPEEDS[1])
  const listRef = useRef<HTMLOListElement>(null)

  usePlayback(playing, speed, duration, until, setUntil, () => setPlaying(false))

  const visible = pathing.junglers.filter((j) => !hidden.includes(j.puuid)).map((j) => j.puuid)
  const moments: ListedMoment[] = useMemo(
    () =>
      pathing.junglers
        .flatMap((jungler, index) =>
          hidden.includes(jungler.puuid) ? [] : jungler.moments.map((moment) => ({ key: `${index}-${moment.t}-${moment.type}`, moment, index })),
        )
        .sort((a, b) => a.moment.t - b.moment.t),
    [pathing, hidden],
  )

  // Pendant la lecture, la liste suit le dernier moment passé.
  const latestKey = [...moments].reverse().find(({ moment }) => moment.t <= until)?.key ?? null
  const highlighted = hovered ?? focused ?? (playing ? latestKey : null)
  useEffect(() => {
    if (!highlighted) return
    listRef.current?.querySelector(`[data-key="${highlighted}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [highlighted])

  const toggle = (puuid: string) => setHidden((h) => (h.includes(puuid) ? h.filter((p) => p !== puuid) : [...h, puuid]))
  const showOnly = (puuid: string) => setHidden(pathing.junglers.map((j) => j.puuid).filter((p) => p !== puuid))
  const seek = (t: number) => {
    setPlaying(false)
    setFocused(null)
    setUntil(Math.min(Math.max(t, 0), duration))
  }
  const jumpTo = ({ key, moment }: ListedMoment) => {
    setPlaying(false)
    setFocused(key)
    setUntil(moment.t)
  }
  const play = () => {
    if (until >= duration) setUntil(0)
    setFocused(null)
    setPlaying((p) => !p)
  }

  return (
    <div className={styles.pathing}>
      <div className={styles.mapColumn}>
        <div className={styles.legend}>
          {pathing.junglers.map((jungler, index) => (
            <span key={jungler.puuid} className={styles.legendGroup}>
              <button
                type="button"
                className={styles.legendItem}
                style={{ ['--color' as string]: COLORS[index] }}
                aria-pressed={!hidden.includes(jungler.puuid)}
                onClick={() => toggle(jungler.puuid)}
              >
                <ChampionIcon championName={jungler.championName} size={22} />
                <JunglerName jungler={jungler} />
              </button>
              <button type="button" className={styles.only} onClick={() => showOnly(jungler.puuid)} title="Voir seulement ce jungler">
                seul
              </button>
            </span>
          ))}
          {hidden.length > 0 && (
            <button type="button" className={styles.only} onClick={() => setHidden([])}>
              les deux
            </button>
          )}
        </div>

        <MiniMap
          matchId={pathing.matchId}
          junglers={pathing.junglers}
          visible={visible}
          objectives={pathing.objectives.filter((o) => o.t <= until)}
          moments={moments}
          until={until}
          highlighted={highlighted}
          onHover={setHovered}
          onSelect={jumpTo}
        />

        <div className={styles.timeControls}>
          <button type="button" className={styles.play} onClick={play} aria-label={playing ? 'Pause' : 'Lecture'}>
            {playing ? '❚❚' : '▶'}
          </button>
          <input
            id={`until-${pathing.matchId}`}
            type="range"
            min={0}
            max={duration}
            step={1}
            value={until}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Moment de la game"
          />
          <output htmlFor={`until-${pathing.matchId}`}>{formatDuration(Math.round(until))}</output>
        </div>
        <div className={styles.timeControls}>
          <div className={styles.presets} role="group" aria-label="Aller à">
            {[3, 5, 10, 15].map((minute) => (
              <button key={minute} type="button" onClick={() => seek(minute * 60)}>
                {minute}′
              </button>
            ))}
            <button type="button" onClick={() => seek(duration)}>
              Fin
            </button>
          </div>
          <div className={styles.presets} role="group" aria-label="Vitesse de lecture">
            <span className={styles.presetLabel}>Vitesse</span>
            {SPEEDS.map((value) => (
              <button key={value} type="button" aria-pressed={speed === value} onClick={() => setSpeed(value)}>
                ×{value}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.side}>
        <FirstClear junglers={pathing.junglers} colors={COLORS} />
        <StatsTable junglers={pathing.junglers} />
        <div>
          <h4 className={styles.heading}>Moments forts</h4>
          {moments.length === 0 ? (
            <p className={styles.empty}>Aucun moment fort.</p>
          ) : (
            <ol className={styles.moments} ref={listRef}>
              {moments.map((listed) => (
                <li key={listed.key} data-key={listed.key}>
                  <button
                    type="button"
                    style={{ ['--color' as string]: COLORS[listed.index] }}
                    className={styles.moment}
                    data-future={listed.moment.t > until || undefined}
                    data-highlighted={highlighted === listed.key || undefined}
                    onClick={() => jumpTo(listed)}
                    onMouseEnter={() => setHovered(listed.key)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <time>{formatDuration(listed.moment.t)}</time>
                    <MomentGlyph type={listed.moment.type} />
                    <span>{listed.moment.label}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}

/** Fait avancer le temps à `speed` secondes de jeu par seconde réelle. */
function usePlayback(playing: boolean, speed: number, duration: number, until: number, setUntil: (t: number) => void, onEnd: () => void) {
  const untilRef = useRef(until)
  const onEndRef = useRef(onEnd)
  useEffect(() => {
    untilRef.current = until
    onEndRef.current = onEnd
  })

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const next = Math.min(untilRef.current + ((now - last) / 1000) * speed, duration)
      last = now
      untilRef.current = next
      setUntil(next)
      if (next >= duration) onEndRef.current()
      else frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, speed, duration, setUntil])
}

/** Position estimée à l'instant `t`, entre les deux points connus qui l'encadrent. */
function positionAt(points: PathPoint[], t: number): { x: number; y: number } | null {
  if (points.length === 0) return null
  if (t <= points[0].t) return points[0]
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    if (t <= b.t) {
      const ratio = b.t === a.t ? 1 : (t - a.t) / (b.t - a.t)
      return { x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio }
    }
  }
  return points[points.length - 1]
}

function MiniMap({
  matchId,
  junglers,
  visible,
  objectives,
  moments,
  until,
  highlighted,
  onHover,
  onSelect,
}: {
  matchId: string
  junglers: JunglerPath[]
  visible: string[]
  objectives: Objective[]
  moments: ListedMoment[]
  until: number
  highlighted: string | null
  onHover: (key: string | null) => void
  onSelect: (moment: ListedMoment) => void
}) {
  const data = useStaticData()
  const [imageFailed, setImageFailed] = useState(false)
  const y = (value: number) => MAP_SIZE - value
  const from = until - TRAIL_SECONDS
  /** Opacité d'un point de la route selon son âge : 1 maintenant, 0 il y a 5 minutes. */
  const fade = (t: number) => Math.max(0, 1 - (until - t) / TRAIL_SECONDS)
  const shownMoments = moments.filter(({ key, moment }) => (moment.t <= until && moment.t >= from) || key === highlighted)

  return (
    <svg className={styles.map} viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`} role="img" aria-label="Route des junglers sur la carte">
      <SchematicMap />
      {data && !imageFailed && (
        <image href={mapImage(data.version)} width={MAP_SIZE} height={MAP_SIZE} opacity={0.55} onError={() => setImageFailed(true)} />
      )}

      {objectives.map((o, i) => (
        <g key={i} transform={`translate(${o.x} ${y(o.y)})`} className={styles.objective}>
          <rect x={-260} y={-260} width={520} height={520} rx={90} fill={o.teamId === 100 ? 'var(--win)' : 'var(--loss)'} />
          <title>{`${formatDuration(o.t)} · ${o.label}`}</title>
        </g>
      ))}

      {junglers.map((jungler, index) => {
        if (!visible.includes(jungler.puuid)) return null
        const now = positionAt(jungler.points, until)
        const start = positionAt(jungler.points, Math.max(from, 0))
        const inside = jungler.points.filter((p) => p.t > from && p.t < until)
        const route = [...(start ? [{ ...start, t: Math.max(from, 0) }] : []), ...inside, ...(now ? [{ ...now, t: until }] : [])]
        return (
          <g key={jungler.puuid} style={{ color: COLORS[index] }}>
            {/* Chaque segment est un dégradé : la route s'efface en continu jusqu'à disparaître après 5 minutes. */}
            {route.slice(1).map((p, i) => {
              const previous = route[i]
              const gradient = `trail-${matchId}-${index}-${i}`
              return (
                <g key={`${previous.t}-${p.t}`}>
                  <linearGradient id={gradient} gradientUnits="userSpaceOnUse" x1={previous.x} y1={y(previous.y)} x2={p.x} y2={y(p.y)}>
                    <stop offset="0" stopColor="currentColor" stopOpacity={fade(previous.t)} />
                    <stop offset="1" stopColor="currentColor" stopOpacity={fade(p.t)} />
                  </linearGradient>
                  <line x1={previous.x} y1={y(previous.y)} x2={p.x} y2={y(p.y)} stroke={`url(#${gradient})`} strokeWidth={130} strokeLinecap="round" />
                </g>
              )
            })}
            {inside
              .filter((p) => p.t % 60 === 0)
              .map((p) => (
                <g key={p.t} transform={`translate(${p.x} ${y(p.y)})`} opacity={fade(p.t)}>
                  <circle r={210} fill="var(--bg)" stroke="currentColor" strokeWidth={55} />
                  <text className={styles.minute} dy={90} textAnchor="middle" fill="var(--fg)">
                    {p.t / 60}
                  </text>
                </g>
              ))}
          </g>
        )
      })}

      {shownMoments.map((listed) => (
        <g
          key={listed.key}
          className={styles.mapMoment}
          style={{ color: COLORS[listed.index] }}
          transform={`translate(${listed.moment.x} ${y(listed.moment.y)})`}
          opacity={highlighted === listed.key ? 1 : Math.max(0.35, fade(listed.moment.t))}
          onMouseEnter={() => onHover(listed.key)}
          onMouseLeave={() => onHover(null)}
          onClick={() => onSelect(listed)}
        >
          {highlighted === listed.key && <circle className={styles.pulse} r={520} fill="none" stroke="currentColor" strokeWidth={90} />}
          <g transform={`scale(${highlighted === listed.key ? 1.6 : 1})`}>
            <MomentShape type={listed.moment.type} />
          </g>
          <title>{`${formatDuration(listed.moment.t)} · ${listed.moment.label}`}</title>
        </g>
      ))}

      {junglers.map((jungler, index) => {
        if (!visible.includes(jungler.puuid)) return null
        const now = positionAt(jungler.points, until)
        return now ? <ChampionMarker key={jungler.puuid} id={`${matchId}-${index}`} jungler={jungler} color={COLORS[index]} x={now.x} y={y(now.y)} /> : null
      })}
    </svg>
  )
}

/** Icône du champion à sa position estimée, entourée de la couleur de son équipe. */
function ChampionMarker({ id, jungler, color, x, y }: { id: string; jungler: JunglerPath; color: string; x: number; y: number }) {
  const { name, icon } = useChampion(jungler.championName)
  const radius = 520
  return (
    <g transform={`translate(${x} ${y})`} className={styles.marker}>
      <clipPath id={`marker-${id}`}>
        <circle r={radius} />
      </clipPath>
      <circle r={radius + 90} fill={color} />
      {icon ? (
        <image href={icon} x={-radius} y={-radius} width={radius * 2} height={radius * 2} clipPath={`url(#marker-${id})`} />
      ) : (
        <circle r={radius} fill="var(--surface-3)" />
      )}
      <title>{name}</title>
    </g>
  )
}

/** Lanes, rivière et bases : la carte reste lisible même sans l'image de Riot. */
function SchematicMap() {
  return (
    <g className={styles.schematic}>
      <rect width={MAP_SIZE} height={MAP_SIZE} fill="var(--surface-2)" />
      <path d={`M1200 ${MAP_SIZE - 3000} V1200 H${MAP_SIZE - 3000}`} />
      <path d={`M3000 ${MAP_SIZE - 1200} H${MAP_SIZE - 1200} V3000`} />
      <path d={`M2500 ${MAP_SIZE - 2500} L${MAP_SIZE - 2500} 2500`} />
      <path d={`M1500 1500 L${MAP_SIZE - 1500} ${MAP_SIZE - 1500}`} className={styles.river} />
      <circle cx={1300} cy={MAP_SIZE - 1300} r={1500} className={styles.blueBase} />
      <circle cx={MAP_SIZE - 1300} cy={1300} r={1500} className={styles.redBase} />
    </g>
  )
}

function MomentShape({ type }: { type: Moment['type'] }) {
  switch (type) {
    case 'death':
      return <path d="M-330 -330 L330 330 M330 -330 L-330 330" stroke="var(--loss)" strokeWidth={150} strokeLinecap="round" />
    case 'gank':
      return <rect x={-300} y={-300} width={600} height={600} transform="rotate(45)" fill="currentColor" stroke="var(--bg)" strokeWidth={70} />
    case 'objective':
      return <polygon points="0,-420 120,-130 420,-130 180,60 260,380 0,190 -260,380 -180,60 -420,-130 -120,-130" fill="currentColor" stroke="var(--bg)" strokeWidth={50} />
    default:
      return <circle r={300} fill="currentColor" stroke="var(--bg)" strokeWidth={70} opacity={type === 'assist' ? 0.6 : 1} />
  }
}

function MomentGlyph({ type }: { type: Moment['type'] }) {
  return (
    <svg className={styles.glyph} viewBox="-500 -500 1000 1000" aria-hidden="true">
      <MomentShape type={type} />
    </svg>
  )
}

function StatsTable({ junglers }: { junglers: JunglerPath[] }) {
  const stat = (label: string, pick: (s: JunglerStats) => number | null, format: (v: number) => string = String): VersusRow => {
    const values = junglers.map((j) => pick(j.stats))
    return { label, values: values.map((v) => (v === null ? '–' : format(v))), ahead: aheadOf(values, false) }
  }

  const rows: VersusRow[] = [
    { label: 'Départ', values: junglers.map((j) => (j.stats.startSide ? `côté ${j.stats.startSide}` : '–')) },
    stat('CS à 10′', (s) => s.csAt10),
    stat('Gold à 10′', (s) => s.goldAt10, formatNumber),
    stat('Niveau à 10′', (s) => s.levelAt10),
    stat('Ganks avant 14′', (s) => s.ganksBefore14),
    stat('Minutes en jungle adverse', (s) => s.minutesInEnemyJungle),
    stat('Objectifs (smite)', (s) => s.objectives),
  ]

  return <VersusTable title="À 10 minutes" junglers={junglers} colors={COLORS} rows={rows} />
}
