import { createContext, useContext, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { Menu } from 'lucide-react'
import { Button } from './button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './sheet'
import { cn } from './utils'

/**
 * Trimmed copy of the shadcn Sidebar block: fixed 16rem rail from the `lg` breakpoint,
 * slide-over Sheet below it. Pair it with <SidebarInset> for the page content.
 */

interface SidebarState {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarState | null>(null)

export function useSidebar(): SidebarState {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used inside <SidebarProvider>')
  return ctx
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const value = useMemo(() => ({ mobileOpen, setMobileOpen }), [mobileOpen])
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function Sidebar({ children, label = 'Navegación principal' }: { children: ReactNode; label?: string }) {
  const { mobileOpen, setMobileOpen } = useSidebar()
  return (
    <>
      <aside
        data-slot="sidebar"
        aria-label={label}
        className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex"
      >
        {children}
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left">
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <SheetDescription className="sr-only">{label}</SheetDescription>
          {children}
        </SheetContent>
      </Sheet>
    </>
  )
}

export function SidebarInset({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="sidebar-inset" className={cn('flex min-h-dvh min-w-0 flex-col lg:pl-64', className)} {...props} />
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { setMobileOpen } = useSidebar()
  return (
    <Button variant="ghost" size="icon" aria-label="Abrir menú" className={cn('lg:hidden', className)} onClick={() => setMobileOpen(true)}>
      <Menu className="size-5" aria-hidden />
    </Button>
  )
}

export function SidebarHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="sidebar-header" className={cn('flex items-center gap-2 px-5 pt-6 pb-4', className)} {...props} />
}

export function SidebarContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="sidebar-content" className={cn('flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-2', className)} {...props} />
}

export function SidebarFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="sidebar-footer" className={cn('flex flex-col gap-2 border-t border-sidebar-border p-3', className)} {...props} />
}

export function SidebarMenu({ className, ...props }: ComponentProps<'ul'>) {
  return <ul data-slot="sidebar-menu" className={cn('flex flex-col gap-1', className)} {...props} />
}

export function SidebarMenuItem({ className, ...props }: ComponentProps<'li'>) {
  return <li data-slot="sidebar-menu-item" className={cn('list-none', className)} {...props} />
}

export function SidebarMenuButton({
  asChild = false,
  isActive = false,
  className,
  onClick,
  ...props
}: ComponentProps<'button'> & { asChild?: boolean; isActive?: boolean }) {
  const { setMobileOpen } = useSidebar()
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      data-slot="sidebar-menu-button"
      data-active={isActive}
      aria-current={isActive ? 'page' : undefined}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e)
        setMobileOpen(false)
      }}
      className={cn(
        'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/80 transition-colors outline-none',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/60',
        'data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-primary data-[active=true]:shadow-[0_0_20px_-8px_var(--glow)]',
        '[&_svg]:size-5 [&_svg]:shrink-0',
        className,
      )}
      {...props}
    />
  )
}
