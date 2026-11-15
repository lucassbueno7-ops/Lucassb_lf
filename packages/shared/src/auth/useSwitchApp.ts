import { useCallback } from 'react'
import { buildHandoffUrl, buildPlainUrl, resolveAppUrl, type AppTarget } from '../domain/handoff'
import { supabase } from '../lib/supabase'

/** Base URL of an app. Env vars must be read with literal names so Vite can inline them. */
export function getAppUrl(target: AppTarget): string | null {
  const configured =
    target === 'app'
      ? (import.meta.env.VITE_APP_URL as string | undefined)
      : (import.meta.env.VITE_PANEL_URL as string | undefined)
  return resolveAppUrl(target, configured, import.meta.env.DEV)
}

function showSwitchingOverlay() {
  const el = document.createElement('div')
  el.setAttribute('role', 'status')
  el.textContent = 'Cambiando de app...'
  el.style.cssText =
    'position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:var(--background,#0b0f17);color:var(--muted-foreground,#94a3b8);font:600 14px system-ui,sans-serif'
  document.body.appendChild(el)
}

/**
 * Navigates to the other app carrying the current session in the URL fragment.
 * The local session is dropped afterwards (scope: 'local', nothing is revoked on the
 * server) so only one origin holds the refresh token: sharing a rotating refresh token
 * between two origins would eventually trip Supabase's reuse detection.
 * Without a session (or env URL) it degrades to a plain link / disabled action.
 */
export function useSwitchApp(target: AppTarget) {
  const url = getAppUrl(target)

  const go = useCallback(
    async (path = '/') => {
      if (!url) return
      const { data } = await supabase.auth.getSession()
      const session = data.session
      if (!session) {
        window.location.assign(buildPlainUrl(url, path))
        return
      }
      const destination = buildHandoffUrl(
        url,
        { accessToken: session.access_token, refreshToken: session.refresh_token },
        path,
      )
      showSwitchingOverlay()
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined)
      window.location.assign(destination)
    },
    [url],
  )

  return { available: url !== null, url, go }
}
