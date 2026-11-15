import { Navigate, Route, Routes } from 'react-router-dom'
import { Dumbbell, Users } from 'lucide-react'
import { ChooserPage, LoginPage, RequireRole, WrongAppNotice, getAppUrl } from '@trainer/shared/auth'
import { PanelLayout, type NavItem } from '@trainer/shared/ui'
import { ClientDetailPage } from './pages/ClientDetailPage'
import { ClientsPage } from './pages/ClientsPage'
import { ExerciseCatalogPage } from './pages/ExerciseCatalogPage'
import { RoutineEditorPage } from './pages/RoutineEditorPage'

const NAV: NavItem[] = [
  { to: '/', label: 'Clientes', icon: Users, end: true },
  { to: '/exercises', label: 'Ejercicios', icon: Dumbbell },
]

// Clients who land here by mistake get a link to the client app (VITE_APP_URL, dev fallback localhost:5173).
const clientNotice = (
  <WrongAppNotice
    title="Este es el panel de entrenadores"
    message="Tu cuenta es de cliente. Usá la app de clientes para ver tu rutina y registrar tus entrenamientos."
    href={getAppUrl('app')}
    linkLabel="Ir a la app"
  />
)

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage appName="Lucas Bueno · Panel" />} />

      <Route element={<RequireRole role={['trainer', 'admin']} wrongRole={clientNotice} />}>
        <Route path="choose" element={<ChooserPage current="panel" appName="Lucas Bueno · Panel" />} />
        <Route element={<PanelLayout items={NAV} title="Lucas Bueno · Panel" />}>
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
