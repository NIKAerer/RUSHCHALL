import { useState } from 'react'
import { useProfile } from '../../api/queries'
import type { PlayerStats } from '../../api/types'
import { rankEmblem } from '../../ddragon/ddragon'
import { formatDecimal, formatPercent, formatSigned, kdaRatio } from '../../lib/format'
import { tierLabel } from '../../lib/riot'
import { LpChart } from './LpAndHours'
import { kdaTone } from './tone'
import { axes } from './visual'
import styles from './StatsHero.module.css'
import common from './stats.module.css'

/** En-tête de la page Stats : le rang en grand, le bilan de la sélection et la courbe de LP. */
export function StatsHero({ stats }: { stats: PlayerStats }) {
  const { data: profile } = useProfile()
  const [emblemFailed, setEmblemFailed] = useState(false)
  const solo = profile?.ranked.find((r) => r.queue === 'solo')
  const { form } = stats
  const ratio = stats.games ? stats.wins / stats.games : 0
  const ranked = [...axes(stats)].sort((a, b) => b.score - a.score)
  const [best, worst] = [ranked[0], ranked[ranked.length - 1]]
  const lpDelta = form.lp.length > 1 ? form.lp[form.lp.length - 1].ladder - form.lp[0].ladder : null

  return (
    <section className={styles.hero}>
      {solo && (
        <div className={styles.rank}>
          {!emblemFailed && <img src={rankEmblem(solo.tier)} alt="" onError={() => setEmblemFailed(true)} />}
          <div>
            <span className={styles.tier}>{tierLabel(solo.tier, solo.division)}</span>
            <b className={styles.lp}>
              {solo.leaguePoints} <small>LP</small>
            </b>
            {lpDelta !== null && <span className={lpDelta >= 0 ? common.good : common.bad}>{formatSigned(lpDelta)} LP sur la période</span>}
          </div>
        </div>
      )}

      <div className={styles.record}>
        <div className={styles.ring} style={{ ['--ratio' as string]: ratio }}>
          <span>{formatPercent(ratio)}</span>
        </div>
        <div>
          <b className={styles.wl}>
            {stats.wins}V <span>{stats.games - stats.wins}D</span>
          </b>
          <span className={common.sub}>{stats.games} games</span>
        </div>
      </div>

      <dl className={styles.facts}>
        <div>
          <dt>KDA</dt>
          <dd className={kdaTone((stats.kills + stats.assists) / Math.max(1, stats.deaths))}>{kdaRatio(stats.kills, stats.deaths, stats.assists)}</dd>
        </div>
        <div>
          <dt>Note</dt>
          <dd>{formatDecimal(stats.rating)}</dd>
        </div>
        <div>
          <dt>MVP · ACE</dt>
          <dd>
            {stats.mvp} <span className={common.sub}>·</span> {stats.ace}
          </dd>
        </div>
        <div>
          <dt>Point fort</dt>
          <dd className={common.good}>
            {best.label} <small>{Math.round(best.score)}</small>
          </dd>
        </div>
        <div>
          <dt>À travailler</dt>
          <dd className={common.bad}>
            {worst.label} <small>{Math.round(worst.score)}</small>
          </dd>
        </div>
      </dl>

      <div className={styles.chart}>
        <LpChart points={form.lp} />
      </div>

      <ol className={styles.recent} aria-label="Dernières games, la plus récente à droite">
        {form.recent.map((win, index) => (
          <li key={index} className={win ? styles.win : styles.loss} title={win ? 'Victoire' : 'Défaite'} />
        ))}
      </ol>
    </section>
  )
}
