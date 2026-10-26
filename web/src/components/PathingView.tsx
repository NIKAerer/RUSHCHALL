import { useMemo, useState } from 'react'
import { usePathing } from '../api/queries'
import type { JunglePathing, JunglerPath, Moment, Objective } from '../api/types'
import { mapImage } from '../ddragon/ddragon'
import { useChampion, useStaticData } from '../ddragon/useStaticData'
import { formatDuration, formatNumber } from '../lib/format'
import { ErrorState } from './ErrorState'
import { FirstClear } from './FirstClear'
import { ChampionIcon } from './GameIcons'
import styles from './PathingView.module.css'

/** Les coordonnées Riot vont de 0 à ~15 000, avec la base bleue en bas à gauche. */
const MAP_SIZE = 15000
const EARLY_GAME = 15 * 60

const COLORS = ['var(--path-ally)', 'var(--path-enemy)']

export function PathingView({ matchId }: { matchId: string }) {
  const { data, isPending, isError, error } = usePathing(matchId)

  if (isPending) return <p className={styles.loading}>Chargement du pathing…</p>
  if (isError) return <ErrorState title="Pathing indisponible" message={error.message} />
  if (data.junglers.length === 0) return <p className={styles.loading}>Aucun jungler identifié dans cette game.</p>

  return <Pathing pathing={data} />
}

function Pathing({ pathing }: { pathing: JunglePathing }) {
  const [until, setUntil] = useState(Math.min(EARLY_GAME, pathing.durationSeconds))
  const [hidden, setHidden] = useState<string[]>([])
  const [focused, setFocused] = useState<Moment | null>(null)

  const visible = pathing.junglers.filter((j) => !hidden.includes(j.puuid))
  const moments = useMemo(
    () =>
      pathing.junglers
        .flatMap((jungler, index) => jungler.moments.map((moment) => ({ moment, index, jungler })))
        .filter(({ moment, jungler }) => moment.t <= until && !hidden.includes(jungler.puuid))
        .sort((a, b) => a.moment.t - b.moment.t),
    [pathing, until, hidden],
  )

  const toggle = (puuid: string) => setHidden((h) => (h.includes(puuid) ? h.filter((p) => p !== puuid) : [...h, puuid]))

  return (
    <div className={styles.pathing}>
      <div className={styles.mapColumn}>
        <div className={styles.legend}>
          {pathing.junglers.map((jungler, index) => (
            <button
              key={jungler.puuid}
              type="button"
              className={styles.legendItem}
              style={{ ['--color' as string]: COLORS[index] }}
              aria-pressed={!hidden.includes(jungler.puuid)}
              onClick={() => toggle(jungler.puuid)}
            >
              <ChampionIcon championName={jungler.championName} size={22} />
              <JunglerName jungler={jungler} />
            </button>
          ))}
        </div>

        <MiniMap
          junglers={pathing.junglers}
          visible={visible.map((j) => j.puuid)}
          objectives={pathing.objectives.filter((o) => o.t <= until)}
          until={until}
          focused={focused}
        />

        <div className={styles.timeControls}>
          <input
            id={`until-${pathing.matchId}`}
            type="range"
            min={60}
            max={pathing.durationSeconds}
            step={30}
            value={until}
            onChange={(e) => setUntil(Number(e.target.value))}
            aria-label="Afficher la route jusqu'à"
          />
          <output htmlFor={`until-${pathing.matchId}`}>{formatDuration(Math.min(until, pathing.durationSeconds))}</output>
          <div className={styles.presets}>
            {[5, 10, 15].map((minute) => (
              <button key={minute} type="button" onClick={() => setUntil(Math.min(minute * 60, pathing.durationSeconds))}>
                {minute}′
              </button>
            ))}
            <button type="button" onClick={() => setUntil(pathing.durationSeconds)}>
              Fin
            </button>
          </div>
        </div>
      </div>

      <div className={styles.side}>
        <FirstClear junglers={pathing.junglers} colors={COLORS} />
        <StatsTable junglers={pathing.junglers} />
        <div>
          <h4 className={styles.heading}>Moments forts</h4>
          {moments.length === 0 ? (
            <p className={styles.empty}>Rien avant {formatDuration(until)}.</p>
          ) : (
            <ol className={styles.moments}>
              {moments.map(({ moment, index }) => (
                <li
                  key={`${index}-${moment.t}-${moment.type}`}
                  style={{ ['--color' as string]: COLORS[index] }}
                  onMouseEnter={() => setFocused(moment)}
                  onMouseLeave={() => setFocused(null)}
                >
                  <time>{formatDuration(moment.t)}</time>
                  <MomentGlyph type={moment.type} />
                  <span>{moment.label}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}

function MiniMap({
  junglers,
  visible,
  objectives,
  until,
  focused,
}: {
  junglers: JunglerPath[]
  visible: string[]
  objectives: Objective[]
  until: number
  focused: Moment | null
}) {
  const data = useStaticData()
  const [imageFailed, setImageFailed] = useState(false)
  const y = (value: number) => MAP_SIZE - value

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
        const points = jungler.points.filter((p) => p.t <= until)
        const color = COLORS[index]
        return (
          <g key={jungler.puuid} style={{ color }}>
            {/* Les segments anciens s'effacent pour que la fin de la route reste lisible. */}
            {points.slice(1).map((p, i) => (
              <line
                key={p.t}
                x1={points[i].x}
                y1={y(points[i].y)}
                x2={p.x}
                y2={y(p.y)}
                stroke="currentColor"
                strokeWidth={110}
                strokeLinecap="round"
                opacity={0.2 + 0.8 * (p.t / until)}
              />
            ))}
            {points
              .filter((p) => p.t % 60 === 0)
              .map((p) => (
                <g key={p.t} transform={`translate(${p.x} ${y(p.y)})`}>
                  <circle r={230} fill="var(--bg)" stroke="currentColor" strokeWidth={60} />
                  <text className={styles.minute} dy={95} textAnchor="middle" fill="var(--fg)">
                    {p.t / 60}
                  </text>
                </g>
              ))}
            {jungler.moments
              .filter((m) => m.t <= until)
              .map((m) => (
                <g key={`${m.t}-${m.type}`} transform={`translate(${m.x} ${y(m.y)}) scale(${focused === m ? 1.8 : 1})`}>
                  <MomentShape type={m.type} />
                  <title>{`${formatDuration(m.t)} · ${m.label}`}</title>
                </g>
              ))}
          </g>
        )
      })}
    </svg>
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
  const rows: { label: string; value: (j: JunglerPath) => string }[] = [
    { label: 'Départ', value: (j) => (j.stats.startSide ? `côté ${j.stats.startSide}` : '–') },
    { label: 'CS à 10′', value: (j) => (j.stats.csAt10 === null ? '–' : String(j.stats.csAt10)) },
    { label: 'Gold à 10′', value: (j) => (j.stats.goldAt10 === null ? '–' : formatNumber(j.stats.goldAt10)) },
    { label: 'Niveau à 10′', value: (j) => (j.stats.levelAt10 === null ? '–' : String(j.stats.levelAt10)) },
    { label: 'Ganks avant 14′', value: (j) => String(j.stats.ganksBefore14) },
    { label: 'Minutes en jungle adverse', value: (j) => String(j.stats.minutesInEnemyJungle) },
    { label: 'Objectifs (smite)', value: (j) => String(j.stats.objectives) },
  ]

  return (
    <table className={styles.stats}>
      <thead>
        <tr>
          <th scope="col">
            <span className={styles.visuallyHidden}>Stat</span>
          </th>
          {junglers.map((j, index) => (
            <JunglerHeader key={j.puuid} jungler={j} color={COLORS[index]} />
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <th scope="row">{row.label}</th>
            {junglers.map((j) => (
              <td key={j.puuid}>{row.value(j)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function JunglerHeader({ jungler, color }: { jungler: JunglerPath; color: string }) {
  return (
    <th scope="col" style={{ color }}>
      <JunglerName jungler={jungler} />
    </th>
  )
}

function JunglerName({ jungler }: { jungler: JunglerPath }) {
  const { name } = useChampion(jungler.championName)
  return <span title={jungler.gameName}>{jungler.isTrackedPlayer ? 'Toi' : name}</span>
}
