import { Link, Outlet } from 'react-router-dom'
import { SearchBar } from './SearchBar'
import styles from './Layout.module.css'

export function Layout() {
  return (
    <>
      <header className={styles.topbar}>
        <div className={styles.inner}>
          <Link to="/" className={styles.brand}>
            <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
              <path d="M16 3l11 7v12l-11 7-11-7V10z" fill="none" stroke="currentColor" strokeWidth="2.5" />
            </svg>
            Challenger
          </Link>
          <SearchBar compact />
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  )
}
