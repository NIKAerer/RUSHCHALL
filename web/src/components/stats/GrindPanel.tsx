import type { ReactNode } from 'react'
import type { GameRecord, GrindStats, WinRecord } from '../../api/types'
import { formatDecimal, formatDuration, formatNumber, formatPercent, formatThousands } from '../../lib/format'
import { ChampionIcon } from '../GameIcons'
import { WinRate } from './WinRate'
import styles from './GrindPanel.module.css'
import common from './stats.module.css'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const day = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

/** Icônes au trait, 24 × 24. */
const ICONS = {
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  loop: 'M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5',
  flame: 'M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2-4.5 0 1.5.8 2.5 2 2.5 0-3-1.5-5 1-8Z',
  calendar: 'M4 7h16v13H4zM4 11h16M8 4v4M16 4v4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z',
  sword: 'M14.5 4H20v5.5L10 19.5 6.5 16 16.5 6M5 15l4 4M3 21l3-3',
  skull: 'M12 3a8 8 0 0 0-5 14.2V20h10v-2.8A8 8 0 0 0 12 3ZM9 11h.01M15 11h.01M10 20v-2M14 20v-2',
  coin: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v10M9.5 9.5C10 8.5 14 8 14 10s-4 2-4 4 4 1.5 4.5.5',
  minion: 'M6 20l2-8h8l2 8M8 12a4 4 0 1 1 8 0',
  crown: 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5Z',
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z',
} as const

export function GrindPanel({ grind, games }: { grind: GrindStats; games: number }) {
  const session = grind.longestSession
  const busiest = grind.busiestDay

  return (
    <section className={`${common.panel} ${styles.grind}`}>
      <h2 className={common.title}>Grind</h2>

      <div className={styles.tiles}>
        <Tile icon="clock" label="Temps de jeu" value={`${formatDecimal(grind.hours)} h`} sub={`${grind.activeDays} jours joués`} />
        <Tile icon="loop" label="Sessions" value={formatNumber(grind.sessions)} sub={grind.sessions ? `~${formatDecimal(games / grind.sessions)} games par session` : undefined} />
        <Tile
          icon="flame"
          label="Record session"
          value={session ? `${session.games} games` : '—'}
          sub={session ? `${session.wins}V ${session.games - session.wins}D · ${hoursAndMinutes(session.minutes)} · ${day.format(session.startedAt)}` : undefined}
        />
        <Tile
          icon="calendar"
          label="Record journée"
          value={busiest ? `${busiest.games} games` : '—'}
          sub={busiest ? `${busiest.wins}V ${busiest.games - busiest.wins}D · ${day.format(new Date(`${busiest.key}T12:00:00`))}` : undefined}
        />
        <Tile icon="moon" label="Games de nuit" value={formatNumber(grind.night.games)} sub={grind.night.games ? `0–6 h · ${formatPercent(grind.night.wins / grind.night.games)} V` : '0–6 h'} />
      </div>

      <div className={styles.charts}>
        <div className={styles.chart}>
          <span className={common.label}>Winrate selon la game de la session</span>
          <WinrateBars records={grind.bySessionGame.map((r) => ({ ...r, key: r.key.endsWith('+') ? `${r.key.slice(0, -1)}e+` : `${r.key}e` }))} />
        </div>
        <div className={styles.chart}>
          <span className={common.label}>Tilt</span>
          <ul className={styles.after}>
            <AfterLine label="Après une victoire" record={grind.afterWin} />
            <AfterLine label="Après une défaite" record={grind.afterLoss} />
            <AfterLine label="Après 2 défaites" record={grind.afterTwoLosses} />
          </ul>
        </div>
        <div className={styles.chart}>
          <span className={common.label}>Winrate par jour</span>
          <WinrateBars records={grind.byWeekday.map((r) => ({ ...r, key: WEEKDAYS[Number(r.key) - 1] }))} />
        </div>
      </div>

      <div className={styles.totals}>
        <Counter icon="sword" label="Kills" value={formatNumber(grind.totals.kills)} />
        <Counter icon="skull" label="Morts" value={formatNumber(grind.totals.deaths)} />
        <Counter icon="minion" label="CS" value={formatNumber(grind.totals.cs)} />
        <Counter icon="coin" label="Gold" value={formatThousands(grind.totals.gold)} />
        <Counter icon="drop" label="First bloods" value={formatNumber(grind.totals.firstBloods)} />
        <Counter icon="crown" label="Pentakills" value={formatNumber(grind.totals.pentaKills)} />
      </div>

      <div className={styles.durations}>
        <Duration label="Victoire moyenne" seconds={grind.winDuration} tone="win" />
        <Duration label="Défaite moyenne" seconds={grind.lossDuration} tone="loss" />
        <RecordGame label="Plus longue" game={grind.longestGame} />
        <RecordGame label="Plus courte" game={grind.shortestGame} />
      </div>
    </section>
  )
}

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  )
}

function Tile({ icon, label, value, sub }: { icon: keyof typeof ICONS; label: string; value: string; sub?: ReactNode }) {
  return (
    <div className={styles.tile}>
      <Icon name={icon} />
      <div>
        <div className={common.label}>{label}</div>
        <div className={styles.value}>{value}</div>
        {sub && <div className={common.sub}>{sub}</div>}
      </div>
    </div>
  )
}

/** Barres de winrate avec la ligne des 50 % ; le nombre de games est écrit dessous. */
function WinrateBars({ records }: { records: WinRecord[] }) {
  return (
    <div className={styles.bars}>
      {/* Liste fixe (rangs de session, jours) : l'index suffit comme clé, deux jours s'écrivant « M ». */}
      {records.map((r, index) => {
        const ratio = r.games ? r.wins / r.games : 0
        return (
          <div key={index} className={styles.bar} title={r.games ? `${r.key} : ${r.wins}V ${r.games - r.wins}D · ${formatPercent(ratio)}` : `${r.key} : aucune game`}>
            <span className={styles.barValue}>{r.games ? formatPercent(ratio) : '—'}</span>
            <div className={styles.track}>
              {r.games > 0 && <span className={ratio >= 0.5 ? styles.up : styles.down} style={{ height: `${Math.max(ratio, 0.03) * 100}%` }} />}
            </div>
            <span className={styles.barKey}>{r.key}</span>
            <span className={styles.barGames}>{r.games}</span>
          </div>
        )
      })}
    </div>
  )
}

function AfterLine({ label, record }: { label: string; record: WinRecord }) {
  return (
    <li>
      <span className={common.sub}>{label}</span>
      {record.games ? <WinRate games={record.games} wins={record.wins} /> : <span className={common.empty}>—</span>}
    </li>
  )
}

function Counter({ icon, label, value }: { icon: keyof typeof ICONS; label: string; value: string }) {
  return (
    <div className={styles.counter} title={label}>
      <Icon name={icon} />
      <b>{value}</b>
      <span className={common.sub}>{label}</span>
    </div>
  )
}

function Duration({ label, seconds, tone }: { label: string; seconds: number | null; tone: 'win' | 'loss' }) {
  return (
    <div className={`${styles.duration} ${styles[tone]}`}>
      <span className={common.sub}>{label}</span>
      <b>{seconds === null ? '—' : formatDuration(seconds)}</b>
    </div>
  )
}

function RecordGame({ label, game }: { label: string; game: GameRecord | null }) {
  return (
    <div className={`${styles.duration} ${game ? styles[game.win ? 'win' : 'loss'] : ''}`}>
      <span className={common.sub}>{label}</span>
      {game ? (
        <span className={styles.recordGame} title={day.format(game.startedAt)}>
          <ChampionIcon championName={game.championName} size={22} />
          <b>{formatDuration(game.durationSeconds)}</b>
        </span>
      ) : (
        <b>—</b>
      )}
    </div>
  )
}

function hoursAndMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  return h ? `${h} h ${String(minutes % 60).padStart(2, '0')}` : `${minutes} min`
}
