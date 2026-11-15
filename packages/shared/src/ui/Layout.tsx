import type { ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ArrowLeftRight, LogOut, type LucideIcon } from 'lucide-react'
import { useAuth } from '../auth/auth-context'
import { useSwitchApp } from '../auth/useSwitchApp'
import type { AppTarget } from '../domain/handoff'
import { isStaff } from '../domain/roles'
import { Badge } from './badge'
import { Button } from './button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from './sidebar'
import { BrandMark } from './ui'
import { cn } from './utils'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

/** Trainers/admins only: hands the session to the other app (see useSwitchApp). */
export function SwitchAppButton({
  target,
  path,
  label,
  ariaLabel,
  className,
}: {
  target: AppTarget
  path: string
  label: string
  ariaLabel?: string
  className?: string
}) {
  const { profile } = useAuth()
  const { available, go } = useSwitchApp(target)
  if (!isStaff(profile?.role)) return null
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn('min-h-11 sm:min-h-9', className)}
      disabled={!available}
      title={available ? undefined : 'Falta configurar la URL de la otra app'}
      aria-label={ariaLabel ?? label}
      onClick={() => void go(path)}
    >
      <ArrowLeftRight aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}

function SignOutButton({ className }: { className?: string }) {
  const { signOut } = useAuth()
  return (
    <Button variant="ghost" size="icon" aria-label="Cerrar sesión" title="Cerrar sesión" className={className} onClick={() => void signOut()}>
      <LogOut className="size-5" aria-hidden />
    </Button>
  )
}

function RoleBadge() {
  const { profile } = useAuth()
  if (profile?.role !== 'admin') return null
  return <Badge variant="default">Admin</Badge>
}

/**
 * Mobile-first shell for the client app: sticky header, optional banner slot and a
 * fixed bottom tab bar with safe-area insets.
 */
export function AppLayout({
  items,
  banner,
  switchTo,
  actions,
  title = 'Lucas Bueno',
}: {
  items: NavItem[]
  banner?: ReactNode
  /** Staff-only shortcut in the header (e.g. back to the panel). */
  switchTo?: { target: AppTarget; path: string; label: string }
  /** Extra header controls, rendered before the switch button. */
  actions?: ReactNode
  title?: string
}) {
  const { profile } = useAuth()
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="flex min-h-14 items-center justify-between gap-2 px-4">
          <BrandMark name={title} />
          <div className="flex items-center gap-1">
            <RoleBadge />
            <span className="hidden max-w-32 truncate text-sm text-muted-foreground sm:inline">{profile?.full_name}</span>
            {actions}
            {switchTo && <SwitchAppButton {...switchTo} />}
            <SignOutButton />
          </div>
        </div>
        {banner}
      </header>
      <main className="flex-1 space-y-4 px-4 pt-4 pb-28">
        <Outlet />
      </main>
      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
      >
        <ul className="mx-auto grid max-w-2xl" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold outline-none transition-colors',
                    'focus-visible:bg-accent',
                    isActive ? 'text-link' : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span aria-hidden className="absolute top-0 h-0.5 w-8 rounded-full bg-primary shadow-[0_0_12px_var(--glow)]" />}
                    <Icon className="size-6" aria-hidden />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

function isActivePath(pathname: string, to: string, end?: boolean): boolean {
  if (end || to === '/') return pathname === to
  return pathname === to || pathname.startsWith(`${to}/`)
}

function PanelNav({ items }: { items: NavItem[] }) {
  const { pathname } = useLocation()
  return (
    <SidebarMenu>
      {items.map(({ to, label, icon: Icon, end }) => (
        <SidebarMenuItem key={to}>
          <SidebarMenuButton asChild isActive={isActivePath(pathname, to, end)}>
            <Link to={to}>
              <Icon aria-hidden />
              <span>{label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

/**
 * Panel shell: left sidebar from 1024px, slide-over menu + top bar below it.
 * The top bar is present at every size and carries the "Ver app" action.
 */
export function PanelLayout({ items, title = 'Lucas Bueno · Panel' }: { items: NavItem[]; title?: string }) {
  const { profile, signOut } = useAuth()
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <BrandMark name={title} className="text-sidebar-foreground" />
        </SidebarHeader>
        <SidebarContent>
          <PanelNav items={items} />
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{profile?.full_name || 'Sin nombre'}</p>
              <p className="text-xs text-sidebar-foreground/70">{profile?.role === 'admin' ? 'Administrador' : 'Entrenador'}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => void signOut()}
            >
              <LogOut className="size-5" aria-hidden />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-20 border-b bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
          <div className="flex min-h-14 items-center gap-2 px-4 lg:px-8">
            <SidebarTrigger className="-ml-2" />
            <BrandMark name={title} className="lg:hidden" />
            <div className="ml-auto flex items-center gap-2">
              <RoleBadge />
              <SwitchAppButton target="app" path="/enter" label="Ver app" ariaLabel="Cambiar a App: ver la app como un cliente" />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 py-5 pb-[calc(2rem+env(safe-area-inset-bottom))] lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
