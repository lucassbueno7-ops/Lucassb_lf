/**
 * Session handoff between the client app and the trainer panel.
 * They are different origins, so localStorage sessions are not shared: the sender
 * puts the tokens in the URL *fragment* (never sent to a server) and the receiver
 * consumes and strips it. Everything here is pure except `captureHandoff`, which
 * receives its browser dependencies as arguments.
 */

export type AppTarget = 'app' | 'panel'

export interface HandoffTokens {
  accessToken: string
  refreshToken: string
}

export const DEV_APP_URLS: Record<AppTarget, string> = {
  app: 'http://localhost:5173',
  panel: 'http://localhost:5174',
}

/** Base URL of the target app: configured value, dev fallback, or null (production without config). */
export function resolveAppUrl(target: AppTarget, configured: string | undefined, isDev: boolean): string | null {
  const value = configured?.trim()
  if (value) return value.replace(/\/+$/, '')
  return isDev ? DEV_APP_URLS[target] : null
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

/** `https://app/path#access_token=...&refresh_token=...` */
export function buildHandoffUrl(baseUrl: string, tokens: HandoffTokens, path = '/'): string {
  const fragment = new URLSearchParams({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  })
  return `${baseUrl.replace(/\/+$/, '')}${normalizePath(path)}#${fragment.toString()}`
}

/** Plain link without credentials (the user signs in again). */
export function buildPlainUrl(baseUrl: string, path = '/'): string {
  return `${baseUrl.replace(/\/+$/, '')}${normalizePath(path)}`
}

/**
 * Reads a handoff out of a location hash. Supabase's own invite/recovery fragments
 * (they carry expires_in / token_type / type) are deliberately not treated as handoffs.
 */
export function parseHandoffFragment(hash: string): HandoffTokens | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  if (!accessToken || !refreshToken) return null
  if (params.has('expires_in') || params.has('token_type') || params.has('type')) return null
  return { accessToken, refreshToken }
}

let pending: HandoffTokens | null = null

/**
 * Captures a handoff from the location and immediately strips the fragment from the
 * address bar. Must run before the Supabase client is created (see handoff-boot).
 */
export function captureHandoff(
  loc: Pick<Location, 'hash' | 'pathname' | 'search'>,
  hist: Pick<History, 'replaceState'>,
): boolean {
  const tokens = parseHandoffFragment(loc.hash)
  if (!tokens) return false
  pending = tokens
  hist.replaceState(null, '', `${loc.pathname}${loc.search}`)
  return true
}

/** Hands the captured tokens to the caller exactly once. */
export function takePendingHandoff(): HandoffTokens | null {
  const tokens = pending
  pending = null
  return tokens
}
