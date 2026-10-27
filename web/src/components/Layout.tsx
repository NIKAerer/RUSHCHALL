import { NavLink, Outlet } from 'react-router-dom'
import { useTheme } from '../lib/theme'
import styles from './Layout.module.css'

export function Layout() {
  const [theme, toggleTheme] = useTheme()

  return (
    <>
      <header className={styles.topbar}>
        <div className={styles.inner}>
          <NavLink to="/" className={styles.brand}>
            <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
              <path d="M16 3l11 7v12l-11 7-11-7V10z" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <path d="M16 10l5 3v6l-5 3-5-3v-6z" fill="currentColor" />
            </svg>
            challenger
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
