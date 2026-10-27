import { useState } from 'react'

export type Theme = 'dark' | 'light'

/** Thème courant, posé sur <html> par index.html avant le premier rendu. */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'))

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      // Stockage indisponible (navigation privée) : le choix vaut pour la session.
    }
    setTheme(next)
  }

  return [theme, toggle]
}
