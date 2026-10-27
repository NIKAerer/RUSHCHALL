import { useId, useState } from 'react'
import { useRoutine } from '../api/queries'
import type { MatchSummary } from '../api/types'
import { useChampion } from '../ddragon/useStaticData'
import { formatDuration, formatPercent, formatSigned, formatTimeAgo, kdaRatio } from '../lib/format'
import { multiKillLabel } from '../lib/riot'
import { ChampionIcon, ItemSlots } from './GameIcons'
import { MatchDetail } from './MatchDetail'
import { RatingBadge } from './RatingBadge'
import styles from './MatchRow.module.css'

type Outcome = 'win' | 'loss' | 'remake'

const OUTCOME_LABELS: Record<Outcome, string> = { win: 'Victoire', loss: 'Défaite', remake: 'Remake' }

/** Une game de l'historique, sur une ligne : champion, score, résultat, build, LP et case « routine ». */
export function MatchRow({ match, puuid }: { match: MatchSummary; puuid: string }) {
  const [open, setOpen] = useState(false)
  const detailId = useId()
  const routine = useRoutine()
  const { player } = match
  const outcome: Outcome = match.remake ? 'remake' : player.win ? 'win' : 'loss'
  const champion = useChampion(player.championName)
  const multiKill = multiKillLabel(player.largestMultiKill)

  return (
    <article className={`${styles.match} ${styles[outcome]}`}>
      <div className={styles.row}>
        <ChampionIcon championName={player.championName} size={48} />

        <div className={styles.score}>
          <b>
            {player.kills} <span>/</span> <em>{player.deaths}</em> <span>/</span> {player.assists}
          </b>
          <small>
            {champion.name} · {kdaRatio(player.kills, player.deaths, player.assists)} KDA
          </small>
        </div>

        <div className={styles.result}>
          <span className={styles.outcome}>{OUTCOME_LABELS[outcome]}</span>
          {multiKill && <span className={styles.multikill}>{multiKill}</span>}
        </div>

        <ItemSlots items={player.items} trinket={player.trinket} size={30} />

        <span className={styles.meta}>
          <span>
            {formatDuration(match.durationSeconds)} · KP {formatPercent(player.killParticipation)} · {player.csPerMinute.toFixed(1).replace('.', ',')} cs
          </span>
          <small>{formatTimeAgo(match.startedAt + match.durationSeconds * 1000)}</small>
        </span>

        <span
          className={`${styles.lp} ${match.lpChange === null ? '' : match.lpChange >= 0 ? styles.gain : styles.drop}`}
          title={match.lpChange === null ? 'LP inconnus : pas de relevé de rang juste avant et après cette game' : 'LP de cette game'}
        >
          {match.lpChange === null ? '— LP' : `${formatSigned(match.lpChange)} LP`}
        </span>

        <div className={styles.rating}>{!match.remake && <RatingBadge rating={player.rating} />}</div>

        <label className={styles.routine} title="Routine respectée sur cette game">
          <input
            type="checkbox"
            checked={match.routine}
            onChange={(event) => routine.mutate({ matchId: match.matchId, routine: event.target.checked })}
            aria-label={`Routine respectée sur la game ${champion.name}`}
          />
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 4h6M9 4a1 1 0 0 0-1 1v1h8V5a1 1 0 0 0-1-1M8 6H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2" />
            <path className={styles.tick} d="m8.5 13.5 2.5 2.5 4.5-5" />
          </svg>
        </label>

        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={detailId}
          aria-label={`${open ? 'Masquer' : 'Afficher'} le détail de la game sur ${champion.name}`}
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div id={detailId} hidden={!open}>
        {open && <MatchDetail matchId={match.matchId} puuid={puuid} />}
      </div>
    </article>
  )
}
