import type { Badge, Fighter, Moment, Zone } from '../api/types'
import { ChampionIcon } from './GameIcons'
import styles from './MomentFeed.module.css'

/**
 * Un moment fort façon kill feed, sans phrase : tueur, action, victime ou objectif,
 * assists en petit et lieu. Le détail en toutes lettres reste dans l'infobulle.
 */
export function MomentFeed({ moment, allyTeam }: { moment: Moment; allyTeam: number }) {
  const good = moment.killer ? moment.killer.teamId === allyTeam : moment.victim?.teamId !== allyTeam

  return (
    <span className={styles.feed} data-good={good || undefined} data-epic={moment.badges.some((b) => EPIC.includes(b)) || undefined}>
      <Portrait fighter={moment.killer} allyTeam={allyTeam} />
      <ActionIcon type={moment.type} />
      {moment.type === 'objective' ? <ObjectiveIcon objective={moment.objective} /> : <Portrait fighter={moment.victim} allyTeam={allyTeam} victim />}
      {moment.assists.length > 0 && (
        <span className={styles.assists} aria-label={`${moment.assists.length} assists`}>
          {moment.assists.map((fighter, i) => (
            <Portrait key={i} fighter={fighter} allyTeam={allyTeam} small />
          ))}
        </span>
      )}
      {moment.badges.length > 0 && (
        <span className={styles.badges}>
          {moment.badges.map((badge) => (
            <span key={badge} className={styles.badge} data-badge={badge}>
              {BADGES[badge]}
            </span>
          ))}
        </span>
      )}
      <ZoneIcon zone={moment.zone} />
    </span>
  )
}

/** Libellés courts, comme les annonces en jeu. */
const BADGES: Record<Badge, string> = {
  first_blood: 'First blood',
  double: 'Double',
  triple: 'Triple',
  quadra: 'Quadra',
  penta: 'Penta',
  ace: 'Ace',
  shutdown: 'Shutdown',
  soul: 'Âme',
}

/** Les moments qui méritent d'être vus de loin dans la liste. */
const EPIC: Badge[] = ['triple', 'quadra', 'penta', 'ace', 'soul']

function Portrait({ fighter, allyTeam, victim = false, small = false }: { fighter: Fighter | null; allyTeam: number; victim?: boolean; small?: boolean }) {
  const size = small ? 20 : 30
  if (!fighter) {
    // Exécution par une tourelle ou des sbires.
    return (
      <span className={styles.portrait} style={{ width: size, height: size }} title="Tourelle ou sbires">
        <svg viewBox="0 0 24 24" className={styles.tower} aria-hidden="true">
          <path d="M7 21h10l-1.5-9H17V5h-2v2h-2V5h-2v2H9V5H7v7h1.5z" />
        </svg>
      </span>
    )
  }
  return (
    <span className={styles.portrait} data-small={small || undefined} data-ally={fighter.teamId === allyTeam || undefined} data-victim={victim || undefined}>
      <ChampionIcon championName={fighter.championName} size={size} />
    </span>
  )
}

function ActionIcon({ type }: { type: Moment['type'] }) {
  if (type === 'death') {
    return (
      <svg viewBox="0 0 24 24" className={styles.action} data-type="death" aria-label="Mort">
        <path d="M12 2C7 2 4 5.5 4 10c0 2.6 1.2 4.4 3 5.5V19a1 1 0 0 0 1 1h1v-2h2v2h2v-2h2v2h1a1 1 0 0 0 1-1v-3.5c1.8-1.1 3-2.9 3-5.5 0-4.5-3-8-8-8Zm-3.5 7a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />
      </svg>
    )
  }
  return (
    <span className={styles.actionWrap}>
      <svg viewBox="0 0 24 24" className={styles.swords} data-type={type} aria-label={type === 'gank' ? 'Gank' : type === 'objective' ? 'Objectif' : 'Kill'}>
        <path d="M4 4l10.5 10.5M13 17l4-4M16.5 16.5l3.5 3.5M20 4 9.5 14.5M11 17l-4-4M7.5 16.5 4 20" />
      </svg>
      {type === 'gank' && (
        <svg viewBox="0 0 24 24" className={styles.gank} aria-hidden="true">
          <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
        </svg>
      )}
    </span>
  )
}

/** Couleur de chaque objectif, par type de drake pour les dragons. */
const OBJECTIVE_COLORS: Record<string, string> = {
  infernal: '#ff6b3d',
  ocean: '#4cc3ff',
  mountain: '#c9a26b',
  cloud: '#d6e6f5',
  hextech: '#3fe0d0',
  chemtech: '#8fd14f',
  elder: '#c58bff',
  dragon: '#ff8a3d',
  baron: '#a66bff',
  herald: '#d38bff',
  grubs: '#9b7bff',
  atakhan: '#e04a4a',
}

const DRAGONS = ['infernal', 'ocean', 'mountain', 'cloud', 'hextech', 'chemtech', 'elder', 'dragon']

export function ObjectiveIcon({ objective }: { objective: string | null }) {
  const kind = objective ?? 'dragon'
  const glyph = DRAGONS.includes(kind) ? 'dragon' : kind
  return (
    <span className={styles.objective} style={{ ['--objective' as string]: OBJECTIVE_COLORS[kind] ?? 'var(--gold)' }}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {glyph === 'dragon' && <path d="M4 18c2-1 3-3 3-6 2 2 4 2 6 1-1-2-1-4 1-6l1 3 4-4-1 6c2 1 3 3 2 6l-3-2c-1 2-3 3-6 3l1 3-4-2-2 1z" />}
        {glyph === 'baron' && <path d="M12 3c-4 0-7 3-7 7 0 3 1.5 5 3 6v5l2-2 2 2 2-2 2 2v-5c1.5-1 3-3 3-6 0-4-3-7-7-7Zm-3 6.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />}
        {glyph === 'herald' && <path d="M12 5C6.5 5 3 12 3 12s3.5 7 9 7 9-7 9-7-3.5-7-9-7Zm0 3.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />}
        {glyph === 'grubs' && <path d="M7 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm10 0a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm-5-5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 10a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />}
        {glyph === 'atakhan' && <path d="M3 3c2 4 4 6 6 6h6c2 0 4-2 6-6-1 5-2 8-4 9l-1 8h-2l-1-4h-2l-1 4H8l-1-8C5 11 4 8 3 3Z" />}
      </svg>
    </span>
  )
}

const ZONE_LABELS: Record<Zone, string> = {
  base: 'Base',
  top: 'Top',
  mid: 'Mid',
  bot: 'Bot',
  river: 'Rivière',
  allyJungle: 'Jungle',
  enemyJungle: 'Jungle adverse',
}

/** Petit plan de la carte avec la zone en surbrillance, comme les icônes de rôle. */
export function ZoneIcon({ zone }: { zone: Zone }) {
  return (
    <svg viewBox="0 0 24 24" className={styles.zone} data-zone={zone} role="img" aria-label={ZONE_LABELS[zone]}>
      <title>{ZONE_LABELS[zone]}</title>
      <rect x="2" y="2" width="20" height="20" rx="3" className={styles.zoneMap} />
      {zone === 'top' && <path d="M5 19V5h14" />}
      {zone === 'bot' && <path d="M5 19h14V5" />}
      {zone === 'mid' && <path d="M5 19 19 5" />}
      {zone === 'river' && <path d="M5 5c3 1 3 4 7 7s4 6 7 7" />}
      {(zone === 'allyJungle' || zone === 'enemyJungle') && <path d="M12 5 7 13h3l-2 5h8l-2-5h3z" />}
      {zone === 'base' && <path d="M6 18v-5l3-3 3 3v5z" />}
    </svg>
  )
}
