import type { EarlyGame, JunglerPath } from '../api/types'
import { formatDuration, formatNumber } from '../lib/format'
import { ChampionIcon, ItemIcon } from './GameIcons'
import { aheadOf } from '../lib/compare'
import { JunglerName, VersusTable, type VersusRow } from './Versus'
import styles from './FirstClear.module.css'

const END_REASONS: Record<NonNullable<EarlyGame['clearEndReason']>, string> = {
  back: 'back',
  gank: 'gank',
  kill: 'kill',
  assist: 'combat',
  death: 'mort',
}

const SIDES = { ally: 'sa jungle', enemy: 'invade', river: 'rivière' } as const

/** Premier clear des deux junglers, puis leurs repères de début de game face à face. */
export function FirstClear({ junglers, colors }: { junglers: JunglerPath[]; colors: string[] }) {
  return (
    <section className={styles.firstClear}>
      {junglers.map((jungler, index) => (
        <ClearRoute key={jungler.puuid} jungler={jungler} color={colors[index]} />
      ))}
      <VersusTable title="Repères" junglers={junglers} colors={colors} rows={milestones(junglers.map((j) => j.earlyGame))} />
    </section>
  )
}

function ClearRoute({ jungler, color }: { jungler: JunglerPath; color: string }) {
  const { clear, clearEnd, clearEndReason, jungleCsAtClearEnd } = jungler.earlyGame

  return (
    <div className={styles.route} style={{ ['--color' as string]: color }}>
      <div className={styles.routeHeader}>
        <ChampionIcon championName={jungler.championName} size={24} />
        <JunglerName jungler={jungler} />
        <span className={styles.badges}>
          {clearEnd !== null && clearEndReason !== null && (
            <span className={styles.badge}>
              fin <strong>{formatDuration(clearEnd)}</strong> · {END_REASONS[clearEndReason]}
            </span>
          )}
          <span className={styles.badge}>
            <strong>{jungleCsAtClearEnd}</strong> CS
          </span>
        </span>
      </div>
      <ol className={styles.camps}>
        {clear.map((step) => (
          <li
            key={step.t}
            className={styles.camp}
            data-side={step.side ?? 'none'}
            title={`${step.side ? SIDES[step.side] : 'hors des camps'} · ${step.jungleCs} CS jungle`}
          >
            <time>{formatDuration(step.t)}</time>
            <span className={styles.campName}>{step.label}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function milestones(games: EarlyGame[]): VersusRow[] {
  const time = (value: number | null) => (value === null ? '–' : formatDuration(value))
  const timed = (label: string, pick: (e: EarlyGame) => number | null): VersusRow => {
    const values = games.map(pick)
    return { label, values: values.map(time), ahead: aheadOf(values, true) }
  }

  return [
    timed('Niveau 3', (e) => e.levels['3']),
    timed('Niveau 4', (e) => e.levels['4']),
    timed('Niveau 6', (e) => e.levels['6']),
    {
      ...timed('Premier back', (e) => e.firstBack?.t ?? null),
      values: games.map((e) =>
        e.firstBack ? (
          <>
            {time(e.firstBack.t)}
            {e.firstBack.itemIds.map((id, i) => (
              <ItemIcon key={i} itemId={id} size={18} />
            ))}
            {e.firstBack.gold !== null && <small className={styles.gold}>{formatNumber(e.firstBack.gold)} g</small>}
          </>
        ) : (
          '–'
        ),
      ),
    },
    {
      ...timed('Premier gank', (e) => e.firstGank?.t ?? null),
      values: games.map((e) =>
        e.firstGank ? (
          <>
            {time(e.firstGank.t)} <small className={styles.lane}>{e.firstGank.zone}</small>
          </>
        ) : (
          '–'
        ),
      ),
    },
    timed('Première invade', (e) => e.firstInvade),
  ]
}
