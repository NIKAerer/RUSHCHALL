import styles from './stats.module.css'

/** Vert quand le joueur suivi est devant, rouge quand il est derrière. */
export function toneOf(value: number | null): string | undefined {
  if (value === null || value === 0) return undefined
  return value > 0 ? styles.good : styles.bad
}

/** Couleur d'un KDA par palier, comme sur dpm.lol. */
export function kdaTone(ratio: number): string | undefined {
  if (ratio >= 5) return styles.legendary
  if (ratio >= 3.5) return styles.great
  if (ratio >= 2.5) return styles.good
  return undefined
}

/** Couleur d'un winrate par palier : doré dès 70 %, vert dès 60 %, neutre de 50 à 59 %, rouge sous 50 %. */
export function winrateTone(ratio: number): string | undefined {
  if (ratio >= 0.7) return styles.legendary
  if (ratio >= 0.6) return styles.good
  if (ratio < 0.5) return styles.bad
  return undefined
}
