import { useState } from 'react'
import { useGame } from '../api/queries'
import type { Participant, Team } from '../api/types'
import { useChampion } from '../ddragon/useStaticData'
import { formatNumber, formatPercent, formatThousands, kdaRatio } from '../lib/format'
import { ErrorState } from './ErrorState'
import { ChampionIcon, ItemSlots, SpellsAndRunes } from './GameIcons'
import { PathingView } from './PathingView'
import { RatingBadge } from './RatingBadge'
import styles from './MatchDetail.module.css'

const OBJECTIVES: { key: keyof Team['objectives']; label: string }[] = [
  { key: 'voidGrubs', label: 'Larves' },
  { key: 'riftHeralds', label: 'Héraut' },
  { key: 'dragons', label: 'Drakes' },
  { key: 'atakhans', label: 'Atakhan' },
  { key: 'barons', label: 'Nashor' },
  { key: 'towers', label: 'Tours' },
  { key: 'inhibitors', label: 'Inhibs' },
]

type Tab = 'scoreboard' | 'pathing'

export function MatchDetail({ matchId, puuid }: { matchId: string; puuid: string }) {
  const [tab, setTab] = useState<Tab>('scoreboard')

  return (
    <div className={styles.detail}>
      <div className={styles.tabs} role="tablist" aria-label="Détail de la game">
        {(
          [
            ['scoreboard', 'Tableau'],
            ['pathing', 'Pathing jungle'],
          ] as const
        ).map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'scoreboard' ? <Scoreboard matchId={matchId} puuid={puuid} /> : <PathingView matchId={matchId} />}
    </div>
  )
}

function Scoreboard({ matchId, puuid }: { matchId: string; puuid: string }) {
  const { data, isPending, isError, error } = useGame(matchId)

  if (isPending) return <p className={styles.loading}>Chargement de la game…</p>
  if (isError) return <ErrorState title="Détail indisponible" message={error.message} />

  const [blue, red] = data.teams
  const maxDamage = Math.max(...data.teams.flatMap((t) => t.participants.map((p) => p.damageToChampions)))
  const playerTeam = data.teams.find((t) => t.participants.some((p) => p.puuid === puuid)) ?? blue
  const ordered = playerTeam === blue ? [blue, red] : [red, blue]

  return (
    <>
      <TeamBalance blue={blue} red={red} />
      {ordered.map((team) => (
        <TeamTable key={team.teamId} team={team} puuid={puuid} maxDamage={maxDamage} remake={data.remake} />
      ))}
    </>
  )
}

function TeamBalance({ blue, red }: { blue: Team; red: Team }) {
  const bar = (label: string, a: number, b: number, format: (n: number) => string) => (
    <div className={styles.balance}>
      <span>{format(a)}</span>
      <div className={styles.track} role="img" aria-label={`${label} : ${format(a)} contre ${format(b)}`}>
        <div className={styles.blueBar} style={{ flexGrow: a || 1 }} />
        <div className={styles.redBar} style={{ flexGrow: b || 1 }} />
        <em>{label}</em>
      </div>
      <span>{format(b)}</span>
    </div>
  )

  return (
    <div className={styles.balances}>
      {bar('Kills', blue.kills, red.kills, String)}
      {bar('Gold', blue.gold, red.gold, formatThousands)}
    </div>
  )
}

function TeamTable({ team, puuid, maxDamage, remake }: { team: Team; puuid: string; maxDamage: number; remake: boolean }) {
  const outcome = remake ? 'Remake' : team.win ? 'Victoire' : 'Défaite'
  const side = team.teamId === 100 ? 'côté bleu' : 'côté rouge'

  return (
    <div className={`${styles.team} ${remake ? '' : team.win ? styles.win : styles.loss}`}>
      <div className={styles.teamHeader}>
        <h3>
          {outcome} <span>{side}</span>
        </h3>
        <ul className={styles.objectives}>
          {OBJECTIVES.map(({ key, label }) => (
            <li key={key}>
              {label} <b>{team.objectives[key]}</b>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.left}>Joueur</th>
              {!remake && <th scope="col">Note</th>}
              <th scope="col">KDA</th>
              <th scope="col">Dégâts</th>
              <th scope="col">Gold</th>
              <th scope="col">CS</th>
              <th scope="col">Vision</th>
              <th scope="col" className={styles.left}>Objets</th>
            </tr>
          </thead>
          <tbody>
            {team.participants.map((p) => (
              <PlayerRow key={p.puuid} player={p} isMe={p.puuid === puuid} maxDamage={maxDamage} remake={remake} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PlayerRow({ player, isMe, maxDamage, remake }: { player: Participant; isMe: boolean; maxDamage: number; remake: boolean }) {
  const champion = useChampion(player.championName)

  return (
    <tr className={isMe ? styles.me : undefined}>
      <td className={styles.left}>
        <div className={styles.player}>
          <ChampionIcon championName={player.championName} size={34} level={player.championLevel} />
          <SpellsAndRunes spells={player.summonerSpells} keystone={player.keystone} secondaryStyle={player.secondaryRuneStyle} size={16} />
          <div className={styles.who}>
            <span className={styles.gameName} title={`${player.gameName}#${player.tagLine}`}>{player.gameName}</span>
            <span>{champion.name}</span>
          </div>
        </div>
      </td>
      {!remake && (
        <td>
          <RatingBadge rating={player.rating} />
        </td>
      )}
      <td>
        <div className={styles.cellMain}>
          {player.kills}/<em>{player.deaths}</em>/{player.assists}
        </div>
        <div className={styles.cellSub}>
          {kdaRatio(player.kills, player.deaths, player.assists)} · {formatPercent(player.killParticipation)}
        </div>
      </td>
      <td>
        <div className={styles.cellMain}>{formatNumber(player.damageToChampions)}</div>
        <div className={styles.damage}>
          <div style={{ width: `${(player.damageToChampions / maxDamage) * 100}%` }} />
        </div>
      </td>
      <td>
        <div className={styles.cellMain}>{formatThousands(player.gold)}</div>
      </td>
      <td>
        <div className={styles.cellMain}>{player.cs}</div>
        <div className={styles.cellSub}>{player.csPerMinute.toFixed(1).replace('.', ',')}/min</div>
      </td>
      <td>
        <div className={styles.cellMain}>{player.visionScore}</div>
        <div className={styles.cellSub} title="Wards posées / détruites / pinks achetées">
          {player.wardsPlaced}/{player.wardsKilled}/{player.controlWardsBought}
        </div>
      </td>
      <td className={styles.left}>
        <ItemSlots items={player.items} trinket={player.trinket} size={24} />
      </td>
    </tr>
  )
}
