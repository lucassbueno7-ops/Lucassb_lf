import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage, RequireRole, WrongAppNotice } from '@trainer/shared/auth'
import { Layout } from '@trainer/shared/ui'
import { ClientDetailPage } from './pages/ClientDetailPage'
import { ClientsPage } from './pages/ClientsPage'
import { ExerciseCatalogPage } from './pages/ExerciseCatalogPage'
import { RoutineEditorPage } from './pages/RoutineEditorPage'

const NAV = [
  { to: '/', label: 'Clientes', end: true },
  { to: '/exercises', label: 'Ejercicios' },
]

// Optional: URL of the client app, shown to clients who land here by mistake.
const appUrl = import.meta.env.VITE_APP_URL as string | undefined

const clientNotice = (
  <WrongAppNotice
    title="Este es el panel de entrenadores"
    message="Tu cuenta es de cliente. Usá la app de clientes para ver tu rutina y registrar tus entrenamientos."
    href={appUrl}
    linkLabel="Ir a la app"
  />
)

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireRole role={['trainer', 'admin']} wrongRole={clientNotice} />}>
        <Route element={<Layout items={NAV} title="Trainer Panel" />}>
          <Route index element={<ClientsPage />} />
          <Route path="clients/:clientId" element={<ClientDetailPage />} />
          <Route path="clients/:clientId/routine" element={<RoutineEditorPage />} />
          <Route path="exercises" element={<ExerciseCatalogPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
