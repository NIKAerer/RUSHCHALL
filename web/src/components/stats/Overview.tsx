import type { PlayerStats } from '../../api/types'
import { formatDecimal, kdaRatio } from '../../lib/format'
import { WinRate } from './WinRate'
import styles from './Overview.module.css'
import common from './stats.module.css'

export function Overview({ stats }: { stats: PlayerStats }) {
  const { form } = stats

  return (
    <section className={styles.overview} aria-label="Bilan">
      <div className={styles.tile}>
        <span className={common.label}>{stats.games} games</span>
        <WinRate games={stats.games} wins={stats.wins} />
      </div>
      <div className={styles.tile}>
        <span className={common.label}>KDA</span>
        <span className={common.big}>{kdaRatio(stats.kills, stats.deaths, stats.assists)}</span>
        <span className={common.sub}>
          {formatDecimal(stats.kills)} / {formatDecimal(stats.deaths)} / {formatDecimal(stats.assists)}
        </span>
      </div>
      <div className={styles.tile}>
        <span className={common.label}>Note</span>
        <span className={common.big}>{formatDecimal(stats.rating)}</span>
        <span className={styles.badges}>
          <span className={styles.mvp} title="Meilleur joueur de l'équipe gagnante">
            MVP <b>{stats.mvp}</b>
          </span>
          <span className={styles.ace} title="Meilleur joueur de l'équipe perdante">
            ACE <b>{stats.ace}</b>
          </span>
        </span>
      </div>
      <div className={styles.tile}>
        <span className={common.label}>Série</span>
        <span className={`${common.big} ${form.streak > 0 ? common.good : form.streak < 0 ? common.bad : ''}`}>
          {form.streak === 0 ? '—' : `${Math.abs(form.streak)}${form.streak > 0 ? 'V' : 'D'}`}
        </span>
        <ol className={styles.recent} aria-label="Dernières games, la plus récente à droite">
          {form.recent.map((win, index) => (
            <li key={index} className={win ? styles.win : styles.loss} title={win ? 'Victoire' : 'Défaite'} />
          ))}
        </ol>
      </div>
    </section>
  )
}
