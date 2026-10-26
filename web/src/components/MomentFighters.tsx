import type { ReactNode } from 'react'
import type { Fighter, Moment } from '../api/types'
import { ChampionIcon } from './GameIcons'
import styles from './MomentFighters.module.css'

/** Qui a fait quoi : le tueur et la victime en grand, les assists en petit. */
export function MomentFighters({ moment, allyTeam, glyph }: { moment: Moment; allyTeam: number; glyph: ReactNode }) {
  return (
    <span className={styles.fighters}>
      <FighterIcon fighter={moment.killer} allyTeam={allyTeam} size={26} />
      <span className={styles.glyph}>{glyph}</span>
      {moment.victim && <FighterIcon fighter={moment.victim} allyTeam={allyTeam} size={26} victim />}
      {moment.assists.length > 0 && (
        <span className={styles.assists} aria-label="Assists">
          {moment.assists.map((fighter, i) => (
            <FighterIcon key={i} fighter={fighter} allyTeam={allyTeam} size={16} />
          ))}
        </span>
      )}
    </span>
  )
}

function FighterIcon({ fighter, allyTeam, size, victim = false }: { fighter: Fighter | null; allyTeam: number; size: number; victim?: boolean }) {
  if (!fighter) return <span className={styles.unknown} style={{ width: size, height: size }} title="Tourelle ou sbires" />
  return (
    <span className={styles.icon} data-ally={fighter.teamId === allyTeam || undefined} data-victim={victim || undefined}>
      <ChampionIcon championName={fighter.championName} size={size} />
    </span>
  )
}
