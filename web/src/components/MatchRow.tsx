import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Lineup, MatchSummary } from '../api/types'
import { useChampion } from '../ddragon/useStaticData'
import { formatDuration, formatPercent, formatTimeAgo, kdaRatio } from '../lib/format'
import { multiKillLabel, queueLabel, riotIdSlug } from '../lib/riot'
import { ChampionIcon, ItemSlots, SpellsAndRunes } from './GameIcons'
import { MatchDetail } from './MatchDetail'
import styles from './MatchRow.module.css'

type Outcome = 'win' | 'loss' | 'remake'

const OUTCOME_LABELS: Record<Outcome, string> = { win: 'Victoire', loss: 'Défaite', remake: 'Remake' }

export function MatchRow({ match, puuid }: { match: MatchSummary; puuid: string }) {
  const [open, setOpen] = useState(false)
  const detailId = useId()
  const { player } = match
  const outcome: Outcome = match.remake ? 'remake' : player.win ? 'win' : 'loss'
  const champion = useChampion(player.championName)
  const multiKill = multiKillLabel(player.largestMultiKill)

  return (
    <article className={`${styles.match} ${styles[outcome]}`}>
      <div className={styles.row}>
        <div className={styles.info}>
          <span className={styles.queue}>{queueLabel(match.queueId)}</span>
          <span className={styles.ago}>{formatTimeAgo(match.startedAt + match.durationSeconds * 1000)}</span>
          <span className={styles.outcome}>{OUTCOME_LABELS[outcome]}</span>
          <span className={styles.ago}>{formatDuration(match.durationSeconds)}</span>
        </div>

        <div className={styles.loadout}>
          <ChampionIcon championName={player.championName} size={52} level={player.championLevel} />
          <SpellsAndRunes spells={player.summonerSpells} keystone={player.keystone} secondaryStyle={player.secondaryRuneStyle} size={24} />
        </div>

        <div className={styles.kda}>
          <div className={styles.score}>
            {player.kills} <span>/</span> <em>{player.deaths}</em> <span>/</span> {player.assists}
          </div>
          <div className={styles.ratio}>{kdaRatio(player.kills, player.deaths, player.assists)} KDA</div>
          {multiKill && <span className={styles.multikill}>{multiKill}</span>}
        </div>

        <dl className={styles.stats}>
          <div>
            <dt>KP</dt>
            <dd>{formatPercent(player.killParticipation)}</dd>
          </div>
          <div>
            <dt>CS</dt>
            <dd>
              {player.cs} <small>({player.csPerMinute.toFixed(1).replace('.', ',')})</small>
            </dd>
          </div>
          <div>
            <dt>Vision</dt>
            <dd>{player.visionScore}</dd>
          </div>
        </dl>

        <div className={styles.items}>
          <ItemSlots items={player.items} trinket={player.trinket} size={26} />
        </div>

        <div className={styles.lineup}>
          {[100, 200].map((teamId) => (
            <ul key={teamId}>
              {match.lineup
                .filter((p) => p.teamId === teamId)
                .map((p) => (
                  <LineupEntry key={p.puuid} player={p} isMe={p.puuid === puuid} />
                ))}
            </ul>
          ))}
        </div>

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

function LineupEntry({ player, isMe }: { player: Lineup; isMe: boolean }) {
  return (
    <li className={isMe ? styles.me : undefined}>
      <ChampionIcon championName={player.championName} size={16} />
      <Link to={`/joueur/${encodeURIComponent(riotIdSlug(player.gameName, player.tagLine))}`} title={`${player.gameName}#${player.tagLine}`}>
        {player.gameName}
      </Link>
    </li>
  )
}
