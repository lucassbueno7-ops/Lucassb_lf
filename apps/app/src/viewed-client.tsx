import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { isStaff, isTrainee, resolveAppMode, type AppMode } from '@trainer/shared/domain'
import { useAuth, type Profile } from '@trainer/shared/auth'

/**
 * Whose data the client pages show.
 * - 'self': the viewer's own routine, fully writable (clients, and trainee staff via "Mi rutina").
 * - 'preview': staff browse a client's app read-only.
 * - 'choose': trainee staff have not picked a mode yet.
 */
export interface ViewedClient {
  mode: AppMode | 'choose'
  /** '' while staff have not picked a mode / client yet. */
  clientId: string
  client: Profile | null
  readOnly: boolean
  isPreview: boolean
  /** Trainee staff can toggle between "Mi rutina" and preview. */
  canSwitchMode: boolean
  select: (client: Profile) => void
  clear: () => void
  setMode: (mode: AppMode) => void
}

const ViewedClientContext = createContext<ViewedClient | null>(null)

const STORAGE_KEY = 'trainer.preview.client'
const MODE_KEY = 'trainer.app.mode'

function readStored(): Profile | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Profile) : null
  } catch {
    return null
  }
}

function writeStored(client: Profile | null) {
  try {
    if (client) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(client))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable: the selection just will not survive a reload */
  }
}

function readMode(): AppMode | null {
  try {
    const raw = sessionStorage.getItem(MODE_KEY)
    return raw === 'self' || raw === 'preview' ? raw : null
  } catch {
    return null
  }
}

function writeMode(mode: AppMode) {
  try {
    sessionStorage.setItem(MODE_KEY, mode)
  } catch {
    /* storage unavailable: the mode just will not survive a reload */
  }
}

export function ViewedClientProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const [selected, setSelected] = useState<Profile | null>(() => readStored())
  const [storedMode, setStoredMode] = useState<AppMode | null>(() => readMode())

  const select = useCallback((client: Profile) => {
    writeStored(client)
    setSelected(client)
    writeMode('preview')
    setStoredMode('preview')
  }, [])
  const clear = useCallback(() => {
    writeStored(null)
    setSelected(null)
  }, [])
  const setMode = useCallback((mode: AppMode) => {
    writeMode(mode)
    setStoredMode(mode)
  }, [])

  const value = useMemo<ViewedClient>(() => {
    const mode = profile ? resolveAppMode(profile, storedMode) : 'choose'
    const client = mode === 'self' ? profile : mode === 'preview' ? selected : null
    const isPreview = mode === 'preview'
    return {
      mode,
      clientId: client?.id ?? '',
      client,
      readOnly: isPreview,
      isPreview,
      canSwitchMode: isStaff(profile?.role) && isTrainee(profile),
      select,
      clear,
      setMode,
    }
  }, [profile, storedMode, selected, select, clear, setMode])

  return <ViewedClientContext.Provider value={value}>{children}</ViewedClientContext.Provider>
}

export function useViewedClient(): ViewedClient {
  const ctx = useContext(ViewedClientContext)
  if (!ctx) throw new Error('useViewedClient must be used inside <ViewedClientProvider>')
  return ctx
}
