import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProfilePage } from './pages/ProfilePage'

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
