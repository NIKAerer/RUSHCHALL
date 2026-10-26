import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseRiotId, riotIdSlug } from '../lib/riot'
import styles from './SearchBar.module.css'

export function SearchBar({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [invalid, setInvalid] = useState(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    const riotId = parseRiotId(value)
    if (!riotId) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    setValue('')
    navigate(`/joueur/${encodeURIComponent(riotIdSlug(riotId.gameName, riotId.tagLine))}`)
  }

  return (
    <form className={`${styles.form} ${compact ? styles.compact : ''}`} onSubmit={submit} role="search">
      <input
        id={compact ? 'search-top' : 'search-home'}
        className={styles.input}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Pseudo#TAG"
        aria-label="Rechercher un joueur (Pseudo#TAG)"
        aria-invalid={invalid}
        autoComplete="off"
        spellCheck={false}
      />
      <button className={styles.button} type="submit" aria-label="Rechercher">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  )
}
