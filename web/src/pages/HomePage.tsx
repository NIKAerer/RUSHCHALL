import { SearchBar } from '../components/SearchBar'
import styles from './HomePage.module.css'

export function HomePage() {
  return (
    <section className={styles.home}>
      <h1>Cherche un joueur</h1>
      <p>Pseudo et tag Riot, par exemple KGB#Мажор.</p>
      <SearchBar />
    </section>
  )
}
