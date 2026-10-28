import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { PlayerPage } from './pages/PlayerPage'
import { ProfilePage } from './pages/ProfilePage'
import { StatsPage } from './pages/StatsPage'

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ProfilePage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="joueur/:gameName/:tagLine" element={<PlayerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
