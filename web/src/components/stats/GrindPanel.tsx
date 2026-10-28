import type { ReactNode } from 'react'
import type { FormStats, GameRecord, GrindStats, PoolWeek, SessionRecord, WinRecord } from '../../api/types'
import { formatDecimal, formatDuration, formatNumber, formatPercent, formatSigned } from '../../lib/format'
import { ChampionIcon } from '../GameIcons'
import { ClimbCard } from './ClimbCard'
import { WinRate } from './WinRate'
import styles from './GrindPanel.module.css'
import common from './stats.module.css'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const day = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const sessionDate = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const BREAKS: Record<string, string> = { short: '< 5 min', medium: '5–15 min', long: '15–45 min' }
const DURATIONS: Record<string, string> = { lt25: '< 25', '25-30': '25–30', '30-35': '30–35', gt35: '35+' }
/** Créneaux d'heure de début (heure de Paris) ; le dernier passe minuit. */
const SLOTS = [
  { label: '6–12 h', hours: [6, 7, 8, 9, 10, 11] },
  { label: '12–18 h', hours: [12, 13, 14, 15, 16, 17] },
  { label: '18–22 h', hours: [18, 19, 20, 21] },
  { label: '22–2 h', hours: [22, 23, 0, 1] },
  { label: '2–6 h', hours: [2, 3, 4, 5] },
]
/** Semaines affichées dans le calendrier : depuis le premier jour joué, entre 4 et 12. */
const CALENDAR_WEEKS = { min: 4, max: 12 }
/** En dessous, un winrate ne veut pas dire grand-chose : la barre est grisée. */
const FEW_GAMES = 5

/** Icônes au trait, 24 × 24. */
const ICONS = {
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  loop: 'M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5',
  flame: 'M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2-4.5 0 1.5.8 2.5 2 2.5 0-3-1.5-5 1-8Z',
  calendar: 'M4 7h16v13H4zM4 11h16M8 4v4M16 4v4',
  streak: 'M4 17l5-5 4 4 7-8M15 8h5v5',
} as const

export function GrindPanel({ grind, form, games }: { grind: GrindStats; form: FormStats; games: number }) {
  const session = grind.longestSession
  const busiest = grind.busiestDay

  return (
    <section className={`${common.panel} ${styles.grind}`}>
      <h2 className={common.title}>Grind</h2>

      <ClimbCard grind={grind} />

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
        <Tile
          icon="streak"
          label="Série en cours"
          value={form.streak === 0 ? '—' : `${Math.abs(form.streak)} ${form.streak > 0 ? 'V' : 'D'}`}
          sub={`record ${form.longestWinStreak} V · ${form.longestLossStreak} D`}
        />
      </div>

      <div className={styles.charts}>
        <div className={styles.chart}>
          <span className={common.label}>Winrate par game de session</span>
          <WinrateBars records={grind.bySessionGame.map((r) => ({ ...r, key: r.key.endsWith('+') ? `${r.key.slice(0, -1)}e+` : `${r.key}e` }))} />
          {grind.stopAfter !== null && (
            <p className={common.sub}>
              Sous 50 % dès la {grind.stopAfter + 1}e game : <b>arrête-toi après {grind.stopAfter}</b>.
            </p>
          )}
        </div>
        <div className={styles.chart}>
          <span className={common.label}>Tilt</span>
          <ul className={styles.after}>
            <AfterLine label="Après une victoire" record={grind.afterWin} />
            <AfterLine label="Après une défaite" record={grind.afterLoss} />
            <AfterLine label="Après 2 défaites" record={grind.afterTwoLosses} />
          </ul>
          {grind.afterTwoLossesLp !== null && (
            <p className={common.sub}>
              S'arrêter après 2 défaites aurait changé ton total de <b className={grind.afterTwoLossesLp > 0 ? common.bad : common.good}>{formatSigned(-grind.afterTwoLossesLp)} LP</b>.
            </p>
          )}
        </div>
        <div className={styles.chart}>
          <span className={common.label}>Winrate par jour</span>
          <WinrateBars records={grind.byWeekday.map((r) => ({ ...r, key: WEEKDAYS[Number(r.key) - 1] }))} />
        </div>
      </div>

      <div className={styles.charts}>
        <div className={styles.chart}>
          <span className={common.label}>Jours joués · {calendarWeeks(grind.calendar)} semaines</span>
          <Calendar days={grind.calendar} weeks={calendarWeeks(grind.calendar)} />
        </div>
        <div className={styles.chart}>
          <span className={common.label}>Winrate selon la pause</span>
          <WinrateBars records={grind.byBreak.map((r) => ({ ...r, key: BREAKS[r.key] ?? r.key }))} />
        </div>
        <div className={styles.chart}>
          <span className={common.label}>Routine</span>
          <ul className={styles.after}>
            <AfterLine label="Routine respectée" record={grind.routine} />
            <AfterLine label="Sans routine" record={grind.noRoutine} />
          </ul>
          {grind.routine.games === 0 && <p className={common.sub}>Coche la case routine sur tes games dans l'historique pour comparer.</p>}
        </div>
      </div>

      <div className={styles.charts}>
        <div className={styles.chart}>
          <span className={common.label}>Winrate par créneau</span>
          <WinrateBars records={SLOTS.map((slot) => slotRecord(slot.label, slot.hours, form.byHour))} />
        </div>
        <div className={styles.chart}>
          <span className={common.label}>Winrate selon la durée</span>
          <WinrateBars records={grind.byDuration.map((r) => ({ ...r, key: DURATIONS[r.key] ?? r.key }))} />
        </div>
        <div className={styles.chart}>
          <span className={common.label}>Pool de champions</span>
          <Pool weeks={grind.pool} mains={grind.mains} />
        </div>
      </div>

      {grind.recentSessions.length > 0 && (
        <div className={styles.chart}>
          <span className={common.label}>Dernières sessions</span>
          <div className={styles.sessions}>
            {grind.recentSessions.map((s) => (
              <SessionLine key={s.startedAt} session={s} />
            ))}
          </div>
        </div>
      )}

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
          <div key={index} className={styles.bar} data-few={(r.games > 0 && r.games < FEW_GAMES) || undefined} title={r.games ? `${r.key} : ${r.wins}V ${r.games - r.wins}D · ${formatPercent(ratio)}` : `${r.key} : aucune game`}>
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

/** Calendrier des jours joués, une colonne par semaine (lundi en haut) : vert quand le bilan du jour est positif. */
function calendarWeeks(days: WinRecord[]): number {
  if (days.length === 0) return CALENDAR_WEEKS.min
  const weeks = Math.ceil((Date.now() - new Date(`${days[0].key}T00:00:00`).getTime()) / (7 * 86_400_000)) + 1
  return Math.min(CALENDAR_WEEKS.max, Math.max(CALENDAR_WEEKS.min, weeks))
}

function Calendar({ days, weeks }: { days: WinRecord[]; weeks: number }) {
  const byKey = new Map(days.map((d) => [d.key, d]))
  const today = new Date()
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7))
  const start = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - (weeks - 1) * 7)
  const cells = Array.from({ length: weeks * 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))

  return (
    <div className={styles.calendar}>
      {cells.map((date) => {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        const played = byKey.get(key)
        const net = played ? 2 * played.wins - played.games : 0
        const tone = !played ? undefined : net > 0 ? 'up' : net < 0 ? 'down' : 'even'
        return (
          <span
            key={key}
            className={styles.dayCell}
            data-tone={date > today ? 'future' : tone}
            style={played ? { opacity: 0.45 + Math.min(played.games, 8) * 0.07 } : undefined}
            title={played ? `${day.format(date)} : ${played.games} games · ${played.wins}V ${played.games - played.wins}D` : day.format(date)}
          />
        )
      })}
    </div>
  )
}

function SessionLine({ session }: { session: SessionRecord }) {
  return (
    <div className={styles.session}>
      <span>{sessionDate.format(session.startedAt)}</span>
      <span className={common.sub}>
        {session.games} game{session.games > 1 ? 's' : ''} · {hoursAndMinutes(session.minutes)}
      </span>
      <WinRate games={session.games} wins={session.wins} />
      <span className={common.sub}>{session.rating === null ? '' : `note ${formatDecimal(session.rating)}`}</span>
      <b className={session.lp === null ? common.sub : session.lp >= 0 ? common.good : common.bad}>{session.lp === null ? '' : `${formatSigned(session.lp)} LP`}</b>
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

function slotRecord(key: string, hours: number[], byHour: WinRecord[]): WinRecord {
  const played = byHour.filter((h) => hours.includes(Number(h.key)))
  return { key, games: played.reduce((n, h) => n + h.games, 0), wins: played.reduce((n, h) => n + h.wins, 0) }
}

/** Part de chaque semaine jouée sur les 3 champions principaux de la période. */
function Pool({ weeks, mains }: { weeks: PoolWeek[]; mains: string[] }) {
  if (weeks.length === 0) return <p className={common.empty}>Aucune game.</p>
  const last = weeks[weeks.length - 1]

  return (
    <>
      <div className={styles.mains}>
        {mains.map((name) => (
          <ChampionIcon key={name} championName={name} size={26} />
        ))}
        <span className={common.sub}>
          {last.champions} champion{last.champions > 1 ? 's' : ''} cette semaine
        </span>
      </div>
      <div className={styles.bars}>
        {weeks.map((w) => {
          const share = w.mainGames / w.games
          return (
            <div key={w.week} className={styles.bar} data-few={w.games < FEW_GAMES || undefined} title={`Semaine du ${day.format(new Date(`${w.week}T12:00:00`))} : ${w.mainGames} games sur ${w.games} avec tes mains`}>
              <span className={styles.barValue}>{formatPercent(share)}</span>
              <div className={`${styles.track} ${styles.plain}`}>
                <span className={styles.main} style={{ height: `${Math.max(share, 0.03) * 100}%` }} />
              </div>
              <span className={styles.barKey}>{w.week.slice(8)}/{w.week.slice(5, 7)}</span>
              <span className={styles.barGames}>{w.games}</span>
            </div>
          )
        })}
      </div>
    </>
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
