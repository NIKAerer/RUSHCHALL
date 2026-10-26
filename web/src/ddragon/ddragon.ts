const BASE = 'https://ddragon.leagueoflegends.com'
const LOCALE = 'fr_FR'

interface SpellFile {
  data: Record<string, { key: string; name: string; image: { full: string } }>
}
interface RuneStyle {
  id: number
  name: string
  icon: string
  slots: { runes: { id: number; name: string; icon: string }[] }[]
}
interface ItemFile {
  data: Record<string, { name: string; plaintext: string; gold: { total: number } }>
}
interface ChampionFile {
  data: Record<string, { id: string; name: string }>
}

export interface Asset {
  name: string
  icon: string
}

export interface StaticData {
  version: string
  spells: Map<number, Asset>
  runes: Map<number, Asset>
  items: Map<number, Asset & { gold: number }>
  champions: Map<string, string>
}

/** Quelques noms de match-v5 qui ne correspondent pas aux fichiers de Data Dragon. */
const CHAMPION_FILE_ALIASES: Record<string, string> = { FiddleSticks: 'Fiddlesticks' }

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Data Dragon: ${response.status} on ${url}`)
  return response.json() as Promise<T>
}

export async function loadStaticData(): Promise<StaticData> {
  const [version] = await getJson<string[]>(`${BASE}/api/versions.json`)
  const data = `${BASE}/cdn/${version}/data/${LOCALE}`
  const [spellFile, runeStyles, itemFile, championFile] = await Promise.all([
    getJson<SpellFile>(`${data}/summoner.json`),
    getJson<RuneStyle[]>(`${data}/runesReforged.json`),
    getJson<ItemFile>(`${data}/item.json`),
    getJson<ChampionFile>(`${data}/champion.json`),
  ])

  const spells = new Map<number, Asset>(
    Object.values(spellFile.data).map((s) => [Number(s.key), { name: s.name, icon: `${BASE}/cdn/${version}/img/spell/${s.image.full}` }]),
  )

  const runes = new Map<number, Asset>()
  for (const style of runeStyles) {
    runes.set(style.id, { name: style.name, icon: `${BASE}/cdn/img/${style.icon}` })
    for (const rune of style.slots.flatMap((slot) => slot.runes)) {
      runes.set(rune.id, { name: rune.name, icon: `${BASE}/cdn/img/${rune.icon}` })
    }
  }

  const items = new Map(
    Object.entries(itemFile.data).map(([id, item]) => [
      Number(id),
      { name: item.name, icon: `${BASE}/cdn/${version}/img/item/${id}.png`, gold: item.gold.total },
    ]),
  )

  const champions = new Map(Object.values(championFile.data).map((c) => [c.id, c.name]))

  return { version, spells, runes, items, champions }
}

export function championIcon(version: string, championName: string): string {
  const file = CHAMPION_FILE_ALIASES[championName] ?? championName
  return `${BASE}/cdn/${version}/img/champion/${file}.png`
}

export function profileIcon(version: string, iconId: number): string {
  return `${BASE}/cdn/${version}/img/profileicon/${iconId}.png`
}

export function rankEmblem(tier: string): string {
  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-${tier.toLowerCase()}.png`
}
