import { useState } from 'react'
import type { Heatmap } from '../../api/types'
import { mapImage } from '../../ddragon/ddragon'
import { useStaticData } from '../../ddragon/useStaticData'
import styles from './HeatmapPanel.module.css'
import common from './stats.module.css'

const MAP_SIZE = 15000

type Layer = 'positions' | 'deaths'

/** Où le joueur suivi passe son temps (relevé chaque minute) et où il meurt. */
export function HeatmapPanel({ heatmap }: { heatmap: Heatmap }) {
  const [layer, setLayer] = useState<Layer>('positions')
  const data = useStaticData()
  const cell = MAP_SIZE / heatmap.size
  const most = Math.max(1, ...heatmap.cells.map(([, , count]) => count))

  return (
    <section className={common.panel}>
      <h2 className={common.title}>
        Heatmap
        <span className={styles.toggle} role="tablist" aria-label="Calque">
          <button type="button" role="tab" aria-selected={layer === 'positions'} onClick={() => setLayer('positions')}>
            Positions
          </button>
          <button type="button" role="tab" aria-selected={layer === 'deaths'} onClick={() => setLayer('deaths')}>
            Morts <b>{heatmap.deaths.length}</b>
          </button>
        </span>
      </h2>
      <svg className={styles.map} viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`} role="img" aria-label={layer === 'positions' ? 'Positions sur la carte' : 'Morts sur la carte'}>
        <rect width={MAP_SIZE} height={MAP_SIZE} className={styles.ground} />
        {data && <image href={mapImage(data.version)} width={MAP_SIZE} height={MAP_SIZE} opacity={0.45} />}
        <defs>
          <filter id="heat-blur">
            <feGaussianBlur stdDeviation={cell * 0.6} />
          </filter>
        </defs>
        {layer === 'positions' && (
          <g filter="url(#heat-blur)">
            {heatmap.cells.map(([column, row, count]) => (
            <rect
              key={`${column}:${row}`}
              x={column * cell}
              y={MAP_SIZE - (row + 1) * cell}
              width={cell}
              height={cell}
              className={styles.cell}
              style={{ opacity: 0.15 + Math.sqrt(count / most) * 0.75 }}
            >
                <title>{count} relevés</title>
              </rect>
            ))}
          </g>
        )}
        {layer === 'deaths' &&
          heatmap.deaths.map(([x, y], index) => (
            <g key={index} transform={`translate(${x} ${MAP_SIZE - y})`} className={styles.death}>
              <circle r={230} />
              <path d="M-110 -110 L110 110 M110 -110 L-110 110" />
            </g>
          ))}
      </svg>
    </section>
  )
}
