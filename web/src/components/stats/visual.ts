import type { PlayerStats } from '../../api/types'

/** Une mesure ramenée sur 0–100 pour le radar et les jauges, à partir de bornes typiques d'un jungler haut elo. */
export interface Axis {
  key: string
  label: string
  value: number
  display: string
  score: number
}

const clamp = (n: number) => Math.max(0, Math.min(100, n))
const scale = (value: number, low: number, high: number) => clamp(((value - low) / (high - low)) * 100)

export function csPerMinute(stats: PlayerStats): number {
  const games = stats.champions.reduce((total, c) => total + c.games, 0)
  return games ? stats.champions.reduce((total, c) => total + c.csPerMinute * c.games, 0) / games : 0
}

export function objectiveShare(stats: PlayerStats): number | null {
  const taken = stats.objectives.reduce((total, o) => total + o.taken, 0)
  const lost = stats.objectives.reduce((total, o) => total + o.lost, 0)
  return taken + lost ? taken / (taken + lost) : null
}

/** Les six axes du radar, façon « DPM Lens ». */
export function axes(stats: PlayerStats): Axis[] {
  const at15 = stats.diffs.find((d) => d.minute === 15)
  const kda = (stats.kills + stats.assists) / Math.max(1, stats.deaths)
  const cs = csPerMinute(stats)
  const share = objectiveShare(stats) ?? 0.5
  const fr = (n: number, digits = 1) => n.toFixed(digits).replace('.', ',')

  return [
    { key: 'combat', label: 'Combat', value: kda, display: `${fr(kda, 2)} KDA`, score: scale(kda, 1.5, 5) },
    { key: 'farm', label: 'Farm', value: cs, display: `${fr(cs)} CS/min`, score: scale(cs, 4, 7.5) },
    { key: 'early', label: 'Early', value: at15?.gold ?? 0, display: `${at15 && at15.gold > 0 ? '+' : ''}${at15?.gold ?? 0} @15`, score: scale(at15?.gold ?? 0, -1000, 1000) },
    { key: 'objectives', label: 'Objectifs', value: share, display: `${Math.round(share * 100)} % pris`, score: scale(share, 0.3, 0.7) },
    { key: 'survival', label: 'Survie', value: stats.deaths, display: `${fr(stats.deaths)} morts`, score: scale(-stats.deaths, -8, -3) },
    { key: 'impact', label: 'Impact', value: stats.rating, display: `${fr(stats.rating)} note`, score: scale(stats.rating, 3.5, 7.5) },
  ]
}

/** Palier de couleur d'un score 0–100. */
export function tier(score: number): 'low' | 'mid' | 'high' | 'top' {
  if (score >= 80) return 'top'
  if (score >= 55) return 'high'
  if (score >= 35) return 'mid'
  return 'low'
}
