import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { Button } from './ui'

export interface NavItem {
  to: string
  label: string
  end?: boolean
}

export function Layout({ items, title = 'Trainer App' }: { items: NavItem[]; title?: string }) {
  const { profile, signOut } = useAuth()
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
      <header className="flex items-center justify-between gap-2 bg-teal-700 px-4 py-2 text-white">
        <span className="font-semibold">{title}</span>
        <div className="flex items-center gap-3 text-sm">
          {profile?.role === 'admin' && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold uppercase">Admin</span>
          )}
          <span className="hidden sm:inline">{profile?.full_name}</span>
          <Button variant="onDark" onClick={() => void signOut()}>
            Salir
          </Button>
        </div>
      </header>
      <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `whitespace-nowrap px-3 py-3 text-sm font-medium ${
                isActive ? 'border-b-2 border-teal-700 text-teal-700' : 'text-slate-600'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <main className="flex-1 space-y-4 p-4">
        <Outlet />
      </main>
    </div>
  )
}
