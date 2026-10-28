import styles from './stats.module.css'

/** Vert quand le joueur suivi est devant, rouge quand il est derrière. */
export function toneOf(value: number | null): string | undefined {
  if (value === null || value === 0) return undefined
  return value > 0 ? styles.good : styles.bad
}

/** Couleur d'un winrate, comme sur la maquette : vert dès 55 %, rouge sous 45 %, neutre entre les deux. Le KDA reste neutre. */
export function winrateTone(ratio: number): string | undefined {
  if (ratio >= 0.55) return styles.good
  if (ratio < 0.45) return styles.bad
  return undefined
}
