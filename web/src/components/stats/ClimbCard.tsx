import { useClimb } from '../../api/queries'
import type { Climb, GrindStats } from '../../api/types'
import { formatNumber, formatSigned } from '../../lib/format'
import styles from './ClimbCard.module.css'
import common from './stats.module.css'

const APEX = ['MASTER', 'GRANDMASTER', 'CHALLENGER']
/** Écart entre LP gagnés et perdus en dessous duquel le MMR est considéré équilibré. */
const MMR_MARGIN = 3

/** En tête du Grind : la distance au seuil Challenger, puis ce que disent les LP gagnés et perdus du MMR. */
export function ClimbCard({ grind }: { grind: GrindStats }) {
  const { data: climb } = useClimb()

  return (
    <div className={styles.card}>
      <div className={styles.goal}>
        <span className={common.label}>Objectif Challenger</span>
        {climb ? <Goal climb={climb} /> : <p className={common.empty}>Chargement des seuils…</p>}
      </div>
      <div className={styles.mmr}>
        <span className={common.label}>LP par game</span>
        <Mmr gain={grind.lpGain} loss={grind.lpLoss} />
      </div>
    </div>
  )
}

function Goal({ climb }: { climb: Climb }) {
  const { leaguePoints: lp, challenger, grandmaster, lpPerDay } = climb
  if (lp === null || !climb.tier || !APEX.includes(climb.tier)) return <p className={common.empty}>Le seuil compte à partir de Master.</p>
  if (challenger === null) return <p className={common.empty}>Seuil Challenger indisponible : Riot ne répond pas.</p>

  const gap = challenger - lp
  const max = Math.max(challenger, lp) * 1.08
  const at = (value: number) => `${(value / max) * 100}%`

  return (
    <>
      <div className={styles.headline}>
        <b className={gap > 0 ? undefined : common.good}>{gap > 0 ? `${formatNumber(gap)} LP` : `${formatSigned(-gap)} LP`}</b>
        <span className={common.sub}>{gap > 0 ? `à gagner pour le seuil (${formatNumber(challenger)} LP)` : `au-dessus du seuil (${formatNumber(challenger)} LP)`}</span>
      </div>
      <div className={styles.track} role="img" aria-label={`${lp} LP, seuil Grandmaster ${grandmaster ?? '?'} LP, seuil Challenger ${challenger} LP`}>
        <span className={styles.fill} style={{ width: at(lp) }} />
        {grandmaster !== null && <span className={styles.mark} style={{ left: at(grandmaster) }} data-label={`GM ${formatNumber(grandmaster)}`} />}
        <span className={`${styles.mark} ${styles.top}`} style={{ left: at(challenger) }} data-label={`Chall ${formatNumber(challenger)}`} />
      </div>
      <p className={common.sub}>{pace(gap, lpPerDay)}</p>
    </>
  )
}

function pace(gap: number, lpPerDay: number | null): string {
  if (lpPerDay === null) return 'Ton rythme apparaît après un jour de relevés.'
  if (gap <= 0) return `Sur ta semaine : ${formatSigned(lpPerDay, 1)} LP par jour.`
  if (lpPerDay <= 0) return `Sur ta semaine : ${formatSigned(lpPerDay, 1)} LP par jour, tu ne t'en rapproches pas.`
  const days = Math.ceil(gap / lpPerDay)
  return `~${days} jour${days > 1 ? 's' : ''} au rythme de ta semaine (${formatSigned(lpPerDay, 1)} LP par jour).`
}

function Mmr({ gain, loss }: { gain: number | null; loss: number | null }) {
  if (gain === null || loss === null) return <p className={common.empty}>Se remplit au fil des games, à chaque mise à jour.</p>

  const balance = gain + loss
  const [tone, verdict] =
    balance >= MMR_MARGIN ? [common.good, 'MMR en avance : tu gagnes plus que tu ne perds.'] : balance <= -MMR_MARGIN ? [common.bad, 'MMR en retard : tu perds plus que tu ne gagnes.'] : [undefined, 'MMR équilibré.']

  return (
    <>
      <div className={styles.headline}>
        <b className={common.good}>{formatSigned(gain)}</b>
        <span className={common.sub}>victoire</span>
        <b className={common.bad}>{formatSigned(loss)}</b>
        <span className={common.sub}>défaite</span>
      </div>
      <p className={`${common.sub} ${tone ?? ''}`}>{verdict}</p>
    </>
  )
}
