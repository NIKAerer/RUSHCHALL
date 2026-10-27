import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useProfile } from '../api/queries'
import { rankEmblem } from '../ddragon/ddragon'
import { tierLabel } from '../lib/riot'
import styles from './Layout.module.css'

export function Layout() {
  return (
    <>
      <header className={styles.topbar}>
        <div className={styles.inner}>
          <NavLink to="/" className={styles.brand}>
            <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
              <path d="M16 3l11 7v12l-11 7-11-7V10z" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <path d="M16 10l5 3v6l-5 3-5-3v-6z" fill="currentColor" />
            </svg>
            Challenger
          </NavLink>
          <nav className={styles.nav}>
            <NavLink to="/" end>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h10" />
              </svg>
              Historique
            </NavLink>
            <NavLink to="/stats">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 20V11M12 20V4M19 20v-6" />
              </svg>
              Stats
            </NavLink>
          </nav>
          <RankChip />
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  )
}

/** Rang Solo/Duo toujours visible en haut à droite. */
function RankChip() {
  const { data } = useProfile()
  const [emblemFailed, setEmblemFailed] = useState(false)
  const solo = data?.ranked.find((r) => r.queue === 'solo')
  if (!solo) return null

  return (
    <div className={styles.rank} title="Classé Solo/Duo">
      {!emblemFailed && <img src={rankEmblem(solo.tier)} alt="" onError={() => setEmblemFailed(true)} />}
      <span>{tierLabel(solo.tier, solo.division)}</span>
      <b>{solo.leaguePoints} LP</b>
    </div>
  )
}
