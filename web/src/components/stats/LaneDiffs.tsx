import type { DiffStats } from '../../api/types'
import { formatPercent, formatSigned } from '../../lib/format'
import { toneOf } from './tone'
import styles from './LaneDiffs.module.css'
import common from './stats.module.css'

/** Écarts moyens avec l'adversaire direct à 10 et 15 minutes. */
export function LaneDiffs({ diffs }: { diffs: DiffStats[] }) {
  return (
    <section className={common.panel}>
      <h2 className={common.title}>Écarts vs adversaire direct</h2>
      {diffs.length === 0 ? (
        <p className={common.empty}>Pas encore de timeline.</p>
      ) : (
        <div className={styles.grid}>
          {diffs.map((d) => (
            <div key={d.minute} className={styles.minute}>
              <span className={styles.at}>@{d.minute}</span>
              <Diff label="Gold" value={d.gold} />
              <Diff label="XP" value={d.xp} />
              <Diff label="CS" value={d.cs} digits={1} />
              <div className={styles.ahead} title={`Devant en gold dans ${formatPercent(d.aheadRate)} des ${d.games} games`}>
                <div className={styles.aheadBar}>
                  <span style={{ width: `${d.aheadRate * 100}%` }} />
                </div>
                <span className={common.sub}>devant {formatPercent(d.aheadRate)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Diff({ label, value, digits = 0 }: { label: string; value: number; digits?: number }) {
  return (
    <div className={styles.diff}>
      <span className={common.label}>{label}</span>
      <span className={`${styles.value} ${toneOf(value) ?? ''}`}>{formatSigned(value, digits)}</span>
    </div>
  )
}
