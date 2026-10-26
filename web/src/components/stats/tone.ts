import styles from './stats.module.css'

/** Vert quand le joueur suivi est devant, rouge quand il est derrière. */
export function toneOf(value: number | null): string | undefined {
  if (value === null || value === 0) return undefined
  return value > 0 ? styles.good : styles.bad
}
