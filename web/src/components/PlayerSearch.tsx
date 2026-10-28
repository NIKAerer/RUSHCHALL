import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseRiotId } from '../lib/riot'
import styles from './PlayerSearch.module.css'

/** Recherche d'un autre joueur EUW, dans la barre du haut. */
export function PlayerSearch() {
  const [text, setText] = useState('')
  const navigate = useNavigate()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const id = parseRiotId(text)
    if (!id) return
    navigate(`/joueur/${encodeURIComponent(id.gameName)}/${encodeURIComponent(id.tagLine)}`)
    setText('')
  }

  return (
    <form className={styles.search} role="search" onSubmit={submit}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m20 20-4.2-4.2M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
      </svg>
      <input type="search" value={text} onChange={(event) => setText(event.target.value)} placeholder="Chercher Pseudo#TAG" aria-label="Chercher un joueur (Pseudo#TAG)" spellCheck={false} autoComplete="off" />
    </form>
  )
}
