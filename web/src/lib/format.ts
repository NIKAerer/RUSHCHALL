const relative = new Intl.RelativeTimeFormat('fr', { numeric: 'auto', style: 'short' })
const number = new Intl.NumberFormat('fr-FR')
const compact = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatTimeAgo(timestamp: number, now = Date.now()): string {
  const minutes = Math.round((timestamp - now) / 60_000)
  if (Math.abs(minutes) < 60) return relative.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return relative.format(hours, 'hour')
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) return relative.format(days, 'day')
  return relative.format(Math.round(days / 30), 'month')
}

export function formatNumber(value: number): string {
  return number.format(value)
}

/** 12 345 → « 12,3k » */
export function formatThousands(value: number): string {
  return value >= 1000 ? `${compact.format(value / 1000)}k` : String(value)
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)} %`
}

export function kdaRatio(kills: number, deaths: number, assists: number): string {
  if (deaths === 0) return 'Parfait'
  return ((kills + assists) / deaths).toFixed(2).replace('.', ',')
}

export function winrate(wins: number, losses: number): number {
  return wins + losses === 0 ? 0 : wins / (wins + losses)
}

/** Écart signé : « +1 234 », « −56 », « 0 ». */
export function formatSigned(value: number, digits = 0): string {
  const text = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(Math.abs(value))
  return value > 0 ? `+${text}` : value < 0 ? `−${text}` : text
}

/** 6.5 → « 6,5 » */
export function formatDecimal(value: number, digits = 1): string {
  return value.toFixed(digits).replace('.', ',')
}
