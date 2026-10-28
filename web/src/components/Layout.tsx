import { NavLink, Outlet } from 'react-router-dom'
import { useProfile } from '../api/queries'
import { useTheme } from '../lib/theme'
import { PlayerSearch } from './PlayerSearch'
import styles from './Layout.module.css'

export function Layout() {
  const [theme, toggleTheme] = useTheme()
  const { data: profile } = useProfile()

  return (
    <>
      <header className={styles.topbar}>
        <div className={styles.inner}>
          <NavLink to="/" className={styles.brand}>
            Challenger
          </NavLink>
          <nav className={styles.nav}>
            <NavLink to="/" end>
              Historique
            </NavLink>
            <NavLink to="/stats">
              Stats
            </NavLink>
          </nav>
          <PlayerSearch />
          {profile && (
            <span className={styles.account}>
              {profile.gameName}#{profile.tagLine} · EUW
            </span>
          )}
          <button type="button" className={styles.theme} onClick={toggleTheme} aria-label={theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {theme === 'dark' ? (
                <path d="M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
              ) : (
                <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
              )}
            </svg>
          </button>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  )
}
