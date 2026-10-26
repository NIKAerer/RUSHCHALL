import type { ReactNode } from 'react'
import type { EarlyGame, JunglerPath } from '../api/types'
import { useChampion } from '../ddragon/useStaticData'
import { formatDuration, formatNumber } from '../lib/format'
import { ChampionIcon, ItemIcon } from './GameIcons'
import styles from './FirstClear.module.css'

const END_REASONS: Record<NonNullable<EarlyGame['clearEndReason']>, string> = {
  back: 'back',
  gank: 'gank',
  kill: 'kill',
  assist: 'combat',
  death: 'mort',
}

/** Premier clear des deux junglers, puis leurs repères de début de game côte à côte. */
export function FirstClear({ junglers, colors }: { junglers: JunglerPath[]; colors: string[] }) {
  return (
    <section className={styles.firstClear}>
      <h4 className={styles.heading}>Premier clear</h4>
      {junglers.map((jungler, index) => (
        <ClearRoute key={jungler.puuid} jungler={jungler} color={colors[index]} />
      ))}
      <p className={styles.note}>Camps déduits de la position relevée chaque minute.</p>
      <Milestones junglers={junglers} colors={colors} />
    </section>
  )
}

function ClearRoute({ jungler, color }: { jungler: JunglerPath; color: string }) {
  const { clear, clearEnd, clearEndReason, jungleCsAtClearEnd } = jungler.earlyGame

  return (
    <div className={styles.route} style={{ ['--color' as string]: color }}>
      <div className={styles.routeHeader}>
        <ChampionIcon championName={jungler.championName} size={20} />
        <JunglerName jungler={jungler} />
        <span className={styles.summary}>
          {clearEnd !== null && clearEndReason !== null
            ? `fin ${formatDuration(clearEnd)} (${END_REASONS[clearEndReason]}) · ${jungleCsAtClearEnd} CS`
            : `${jungleCsAtClearEnd} CS à ${formatDuration(clear.at(-1)?.t ?? 0)}`}
        </span>
      </div>
      <ol className={styles.camps}>
        {clear.map((step) => (
          <li key={step.t} className={styles.camp} data-side={step.side ?? 'none'} title={`${step.jungleCs} CS jungle`}>
            <time>{formatDuration(step.t)}</time>
            <span>{step.label}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** Repères chiffrés ; le plus rapide des deux est mis en avant. */
function Milestones({ junglers, colors }: { junglers: JunglerPath[]; colors: string[] }) {
  const rows: { label: string; time: (e: EarlyGame) => number | null; detail?: (e: EarlyGame) => ReactNode }[] = [
    { label: 'Niveau 3', time: (e) => e.levels['3'] },
    { label: 'Niveau 4', time: (e) => e.levels['4'] },
    { label: 'Niveau 6', time: (e) => e.levels['6'] },
    {
      label: 'Premier back',
      time: (e) => e.firstBack?.t ?? null,
      detail: (e) =>
        e.firstBack && (
          <span className={styles.back}>
            {e.firstBack.gold !== null && <span>{formatNumber(e.firstBack.gold)} g</span>}
            {e.firstBack.itemIds.map((id, i) => (
              <ItemIcon key={i} itemId={id} size={18} />
            ))}
          </span>
        ),
    },
    {
      label: 'Premier gank',
      time: (e) => e.firstGank?.t ?? null,
      detail: (e) => e.firstGank && <span className={styles.detail}>{e.firstGank.zone}</span>,
    },
    { label: 'Première invade', time: (e) => e.firstInvade },
  ]

  return (
    <table className={styles.milestones}>
      <thead>
        <tr>
          <th scope="col">
            <span className={styles.visuallyHidden}>Repère</span>
          </th>
          {junglers.map((j, index) => (
            <th key={j.puuid} scope="col" style={{ color: colors[index] }}>
              <JunglerName jungler={j} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const times = junglers.map((j) => row.time(j.earlyGame))
          const known = times.filter((t): t is number => t !== null)
          const fastest = known.length === times.length && new Set(known).size > 1 ? Math.min(...known) : null
          return (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {junglers.map((j, index) => (
                <td key={j.puuid}>
                  {row.detail?.(j.earlyGame)}
                  <span className={times[index] === fastest ? styles.fastest : undefined}>
                    {times[index] === null ? '–' : formatDuration(times[index])}
                  </span>
                </td>
              ))}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function JunglerName({ jungler }: { jungler: JunglerPath }) {
  const { name } = useChampion(jungler.championName)
  return <span title={jungler.gameName}>{jungler.isTrackedPlayer ? 'Toi' : name}</span>
}
