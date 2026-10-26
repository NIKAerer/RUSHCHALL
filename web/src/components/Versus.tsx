import type { ReactNode } from 'react'
import type { JunglerPath } from '../api/types'
import { useChampion } from '../ddragon/useStaticData'
import { ChampionIcon } from './GameIcons'
import styles from './Versus.module.css'

export interface VersusRow {
  label: string
  values: ReactNode[]
  /** Index du jungler en avance sur cette ligne, s'il y en a un. */
  ahead?: number | null
}

/** Comparaison face à face des deux junglers : toi à gauche, l'adversaire à droite. */
export function VersusTable({ title, junglers, colors, rows }: { title: string; junglers: JunglerPath[]; colors: string[]; rows: VersusRow[] }) {
  return (
    <section className={styles.versus}>
      <div className={styles.header}>
        {junglers.map((jungler, index) => (
          <span key={jungler.puuid} className={styles.side} style={{ color: colors[index] }}>
            <ChampionIcon championName={jungler.championName} size={20} />
            <JunglerName jungler={jungler} />
          </span>
        ))}
        <h4 className={styles.title}>{title}</h4>
      </div>
      <dl className={styles.rows}>
        {rows.map((row) => (
          <div key={row.label} className={styles.row}>
            <dt>{row.label}</dt>
            {row.values.map((value, index) => (
              <dd
                key={index}
                data-ahead={row.ahead === index || undefined}
                data-behind={(row.ahead !== null && row.ahead !== undefined && row.ahead !== index) || undefined}
                style={{ ['--color' as string]: colors[index] }}
              >
                {value}
              </dd>
            ))}
          </div>
        ))}
      </dl>
    </section>
  )
}

export function JunglerName({ jungler }: { jungler: JunglerPath }) {
  const { name } = useChampion(jungler.championName)
  return <span title={jungler.gameName}>{jungler.isTrackedPlayer ? 'Toi' : name}</span>
}
