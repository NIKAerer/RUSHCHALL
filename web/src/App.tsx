import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProfilePage } from './pages/ProfilePage'
import { HomePage } from './pages/HomePage'
import { parseRiotId, riotIdSlug } from './lib/riot'

const defaultPlayer = parseRiotId(import.meta.env.VITE_DEFAULT_RIOT_ID ?? '')

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          index
          element={defaultPlayer ? <Navigate to={`/joueur/${encodeURIComponent(riotIdSlug(defaultPlayer.gameName, defaultPlayer.tagLine))}`} replace /> : <HomePage />}
        />
        <Route path="recherche" element={<HomePage />} />
        <Route path="joueur/:riotId" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
