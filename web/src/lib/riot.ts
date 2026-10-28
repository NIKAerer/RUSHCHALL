const QUEUES: Record<number, string> = {
  420: 'Solo/Duo',
  440: 'Flex',
  400: 'Normale',
  430: 'Normale',
  490: 'Partie rapide',
  450: 'ARAM',
  1700: 'Arena',
  1710: 'Arena',
  900: 'URF',
  1900: 'URF',
}

export function queueLabel(queueId: number): string {
  return QUEUES[queueId] ?? 'Autre'
}

const TIERS: Record<string, string> = {
  IRON: 'Fer',
  BRONZE: 'Bronze',
  SILVER: 'Argent',
  GOLD: 'Or',
  PLATINUM: 'Platine',
  EMERALD: 'Émeraude',
  DIAMOND: 'Diamant',
  MASTER: 'Master',
  GRANDMASTER: 'Grandmaster',
  CHALLENGER: 'Challenger',
}

export function tierLabel(tier: string, division: string | null): string {
  const name = TIERS[tier] ?? tier
  return division ? `${name} ${division}` : name
}

const MULTIKILLS: Record<number, string> = { 2: 'Double kill', 3: 'Triple kill', 4: 'Quadra kill', 5: 'Penta kill' }

export function multiKillLabel(largest: number): string | null {
  return MULTIKILLS[Math.min(largest, 5)] ?? null
}

/** « Pseudo#TAG » ; sans tag, on tente EUW, le tag le plus courant du serveur. */
export function parseRiotId(text: string): { gameName: string; tagLine: string } | null {
  const hash = text.lastIndexOf('#')
  const gameName = (hash === -1 ? text : text.slice(0, hash)).trim()
  const tagLine = (hash === -1 ? '' : text.slice(hash + 1)).trim() || 'EUW'
  return gameName ? { gameName, tagLine } : null
}
