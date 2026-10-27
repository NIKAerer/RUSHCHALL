import type { PlayerStats } from '../../api/types'
import { formatDecimal, formatPercent, kdaRatio } from '../../lib/format'
import { kdaTone } from './tone'
import styles from './SummaryCard.module.css'
import common from './stats.module.css'

/** Bilan de la sélection, en colonne comme la carte de rang de dpm.lol. */
export function SummaryCard({ stats }: { stats: PlayerStats }) {
  const { form } = stats
  const ratio = stats.games ? stats.wins / stats.games : 0

  return (
    <section className={common.panel}>
      <h2 className={common.title}>Bilan</h2>
      <div className={styles.head}>
        <div className={styles.ring} style={{ ['--ratio' as string]: ratio }}>
          <span>{formatPercent(ratio)}</span>
        </div>
        <div>
          <div className={styles.big}>
            {stats.wins}V <span>{stats.games - stats.wins}D</span>
          </div>
          <div className={common.sub}>{stats.games} games</div>
        </div>
      </div>
      <dl className={styles.rows}>
        <div>
          <dt>KDA</dt>
          <dd>
            <b className={kdaTone((stats.kills + stats.assists) / Math.max(1, stats.deaths))}>{kdaRatio(stats.kills, stats.deaths, stats.assists)}</b>
            <small>
              {formatDecimal(stats.kills)} / {formatDecimal(stats.deaths)} / {formatDecimal(stats.assists)}
            </small>
          </dd>
        </div>
        <div>
          <dt>Note moyenne</dt>
          <dd>
            <b>{formatDecimal(stats.rating)}</b>
          </dd>
        </div>
        <div>
          <dt>MVP · ACE</dt>
          <dd>
            <span className={styles.mvp}>{stats.mvp}</span>
            <span className={styles.ace}>{stats.ace}</span>
          </dd>
        </div>
        <div>
          <dt>Série</dt>
          <dd>
            <b className={form.streak > 0 ? common.good : form.streak < 0 ? common.bad : undefined}>
              {form.streak === 0 ? '—' : `${Math.abs(form.streak)}${form.streak > 0 ? 'V' : 'D'}`}
            </b>
            <small>
              record {form.longestWinStreak}V · {form.longestLossStreak}D
            </small>
          </dd>
        </div>
      </dl>
      <ol className={styles.recent} aria-label="Dernières games, la plus récente à droite">
        {form.recent.map((win, index) => (
          <li key={index} className={win ? styles.win : styles.loss} title={win ? 'Victoire' : 'Défaite'} />
        ))}
      </ol>
    </section>
  )
}
