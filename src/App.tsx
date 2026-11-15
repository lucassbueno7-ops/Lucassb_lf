import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './features/auth/auth-context'
import { LoginPage } from './features/auth/LoginPage'
import { SetPasswordPage } from './features/auth/SetPasswordPage'
import { homePathForRole } from './features/auth/routes'
import { BodyWeightPage } from './features/client/BodyWeightPage'
import { MyRoutinePage } from './features/client/MyRoutinePage'
import { ProgressPage } from './features/client/ProgressPage'
import { TodayPage } from './features/client/TodayPage'
import { WeekPage } from './features/client/WeekPage'
import { WorkoutDayPage } from './features/client/WorkoutDayPage'
import { ClientDetailPage } from './features/trainer/ClientDetailPage'
import { ClientsPage } from './features/trainer/ClientsPage'
import { ExerciseCatalogPage } from './features/trainer/ExerciseCatalogPage'
import { RoutineEditorPage } from './features/trainer/RoutineEditorPage'
import { Layout } from './shared/Layout'
import { RequireRole } from './shared/RequireRole'
import { Spinner } from './shared/ui'

function RootRedirect() {
  const { session, profile, loading } = useAuth()
  if (loading) return <Spinner />
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <Spinner label="Cargando perfil..." />
  return <Navigate to={homePathForRole(profile.role)} replace />
}

const TRAINER_NAV = [
  { to: '/trainer', label: 'Clientes', end: true },
  { to: '/trainer/exercises', label: 'Ejercicios' },
]

const CLIENT_NAV = [
  { to: '/app', label: 'Hoy', end: true },
  { to: '/app/week', label: 'Semana' },
  { to: '/app/routine', label: 'Rutina' },
  { to: '/app/progress', label: 'Progreso' },
  { to: '/app/weight', label: 'Mi peso' },
]

export function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/set-password" element={<SetPasswordPage />} />

      <Route element={<RequireRole role="trainer" />}>
        <Route path="/trainer" element={<Layout items={TRAINER_NAV} />}>
          <Route index element={<ClientsPage />} />
          <Route path="clients/:clientId" element={<ClientDetailPage />} />
          <Route path="clients/:clientId/routine" element={<RoutineEditorPage />} />
          <Route path="exercises" element={<ExerciseCatalogPage />} />
        </Route>
      </Route>

      <Route element={<RequireRole role="client" />}>
        <Route path="/app" element={<Layout items={CLIENT_NAV} />}>
          <Route index element={<TodayPage />} />
          <Route path="week" element={<WeekPage />} />
          <Route path="routine" element={<MyRoutinePage />} />
          <Route path="day/:dayId" element={<WorkoutDayPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="weight" element={<BodyWeightPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
