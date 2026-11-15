import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { CalendarDays, ClipboardList, Eye, House, Scale, TrendingUp, UserRound } from 'lucide-react'
import { ChooserPage, LoginPage, RequireRole, useAuth } from '@trainer/shared/auth'
import { isStaff } from '@trainer/shared/domain'
import { AppLayout, Button, type NavItem } from '@trainer/shared/ui'
import { PreviewBanner } from './PreviewBanner'
import { BodyWeightPage } from './pages/BodyWeightPage'
import { ClientPickerPage } from './pages/ClientPickerPage'
import { EnterPage } from './pages/EnterPage'
import { MyRoutinePage } from './pages/MyRoutinePage'
import { ProgressPage } from './pages/ProgressPage'
import { SetPasswordPage } from './pages/SetPasswordPage'
import { TodayPage } from './pages/TodayPage'
import { WeekPage } from './pages/WeekPage'
import { WorkoutDayPage } from './pages/WorkoutDayPage'
import { ViewedClientProvider, useViewedClient } from './viewed-client'

const NAV: NavItem[] = [
  { to: '/', label: 'Hoy', icon: House, end: true },
  { to: '/week', label: 'Semana', icon: CalendarDays },
  { to: '/routine', label: 'Rutina', icon: ClipboardList },
  { to: '/progress', label: 'Progreso', icon: TrendingUp },
  { to: '/weight', label: 'Peso', icon: Scale },
]

/** Trainers/admins must pick a client before seeing the client app. */
function RequireViewedClient() {
  const { mode, isPreview, clientId } = useViewedClient()
  if (mode === 'choose') return <Navigate to="/enter" replace />
  if (isPreview && !clientId) return <Navigate to="/preview" replace />
  return <Outlet />
}

function StaffOnly() {
  const { profile } = useAuth()
  if (!isStaff(profile?.role)) return <Navigate to="/" replace />
  return <Outlet />
}

/** Trainee staff: toggle between their own routine and the read-only client preview. */
function ModeToggle() {
  const { isPreview, setMode } = useViewedClient()
  const navigate = useNavigate()
  const label = isPreview ? 'Mi rutina' : 'Ver como cliente'
  return (
    <Button
      variant="outline"
      size="sm"
      className="min-h-11 sm:min-h-9"
      aria-label={label}
      onClick={() => {
        setMode(isPreview ? 'self' : 'preview')
        navigate(isPreview ? '/' : '/preview')
      }}
    >
      {isPreview ? <UserRound aria-hidden /> : <Eye aria-hidden />}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}

function AppShell() {
  const { isPreview, canSwitchMode } = useViewedClient()
  const { profile } = useAuth()
  const staff = isStaff(profile?.role)
  return (
    <AppLayout
      items={NAV}
      banner={isPreview ? <PreviewBanner /> : undefined}
      actions={canSwitchMode ? <ModeToggle /> : undefined}
      switchTo={staff ? { target: 'panel', path: '/', label: 'Cambiar a Panel' } : undefined}
    />
  )
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/set-password" element={<SetPasswordPage />} />

      {/* Any signed-in role is welcome here: clients use the app, staff preview it. */}
      <Route element={<RequireRole role={['client', 'trainer', 'admin']} wrongRole={null} />}>
        <Route path="choose" element={<ChooserPage current="app" />} />
        <Route element={<ViewedClientProvider><Outlet /></ViewedClientProvider>}>
          <Route element={<StaffOnly />}>
            <Route path="enter" element={<EnterPage />} />
            <Route path="preview" element={<ClientPickerPage />} />
          </Route>
          <Route element={<RequireViewedClient />}>
            <Route element={<AppShell />}>
              <Route index element={<TodayPage />} />
              <Route path="week" element={<WeekPage />} />
              <Route path="routine" element={<MyRoutinePage />} />
              <Route path="day/:dayId" element={<WorkoutDayPage />} />
              <Route path="progress" element={<ProgressPage />} />
              <Route path="weight" element={<BodyWeightPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
