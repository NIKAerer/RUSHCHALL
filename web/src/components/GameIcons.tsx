import { useState } from 'react'
import { useChampion, useStaticData } from '../ddragon/useStaticData'
import styles from './GameIcons.module.css'

function Icon({ src, label, size, round = false }: { src: string | undefined; label: string; size: number; round?: boolean }) {
  const [broken, setBroken] = useState(false)
  const style = { width: size, height: size }
  const className = `${styles.icon} ${round ? styles.round : ''}`

  if (!src || broken) return <span className={className} style={style} title={label} role="img" aria-label={label} />
  return <img className={className} style={style} src={src} alt={label} title={label} loading="lazy" onError={() => setBroken(true)} />
}

export function ChampionIcon({ championName, size = 48, level }: { championName: string; size?: number; level?: number }) {
  const champion = useChampion(championName)
  return (
    <span className={styles.champion}>
      <Icon src={champion.icon} label={champion.name} size={size} />
      {level !== undefined && <span className={styles.level}>{level}</span>}
    </span>
  )
}

export function SpellsAndRunes({ spells, keystone, secondaryStyle, size = 22 }: { spells: [number, number]; keystone: number; secondaryStyle: number; size?: number }) {
  const data = useStaticData()
  const asset = (map: 'spells' | 'runes', id: number) => data?.[map].get(id)

  return (
    <span className={styles.loadout}>
      <span className={styles.column}>
        {spells.map((id, i) => (
          <Icon key={i} src={asset('spells', id)?.icon} label={asset('spells', id)?.name ?? 'Sort'} size={size} />
        ))}
      </span>
      <span className={styles.column}>
        <Icon src={asset('runes', keystone)?.icon} label={asset('runes', keystone)?.name ?? 'Rune'} size={size} round />
        <span className={styles.secondary} style={{ width: size, height: size }}>
          <Icon src={asset('runes', secondaryStyle)?.icon} label={asset('runes', secondaryStyle)?.name ?? 'Rune'} size={Math.round(size * 0.7)} />
        </span>
      </span>
    </span>
  )
}

export function ItemSlots({ items, trinket, size = 24 }: { items: number[]; trinket: number; size?: number }) {
  const data = useStaticData()

  const slot = (id: number, key: string | number) => {
    if (id === 0) return <span key={key} className={styles.emptySlot} style={{ width: size, height: size }} />
    const item = data?.items.get(id)
    return <Icon key={key} src={item?.icon} label={item?.name ?? `Objet ${id}`} size={size} />
  }

  return (
    <span className={styles.items}>
      {items.map((id, i) => slot(id, i))}
      <span className={styles.trinket}>{slot(trinket, 'trinket')}</span>
    </span>
  )
}
