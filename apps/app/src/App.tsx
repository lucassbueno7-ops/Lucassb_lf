import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage, RequireRole, WrongAppNotice } from '@trainer/shared/auth'
import { Layout } from '@trainer/shared/ui'
import { BodyWeightPage } from './pages/BodyWeightPage'
import { MyRoutinePage } from './pages/MyRoutinePage'
import { ProgressPage } from './pages/ProgressPage'
import { SetPasswordPage } from './pages/SetPasswordPage'
import { TodayPage } from './pages/TodayPage'
import { WeekPage } from './pages/WeekPage'
import { WorkoutDayPage } from './pages/WorkoutDayPage'

const NAV = [
  { to: '/', label: 'Hoy', end: true },
  { to: '/week', label: 'Semana' },
  { to: '/routine', label: 'Rutina' },
  { to: '/progress', label: 'Progreso' },
  { to: '/weight', label: 'Mi peso' },
]

// Optional: URL of the trainer panel, shown to trainers who land here by mistake.
const panelUrl = import.meta.env.VITE_PANEL_URL as string | undefined

const trainerNotice = (
  <WrongAppNotice
    title="Esta es la app de clientes"
    message="Tu cuenta es de entrenador o administrador. Usá el panel de entrenadores para gestionar clientes y rutinas."
    href={panelUrl}
    linkLabel="Ir al panel"
  />
)

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/set-password" element={<SetPasswordPage />} />

      <Route element={<RequireRole role="client" wrongRole={trainerNotice} />}>
        <Route element={<Layout items={NAV} />}>
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
