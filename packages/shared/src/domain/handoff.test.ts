import { describe, expect, it, vi } from 'vitest'
import {
  DEV_APP_URLS,
  buildHandoffUrl,
  captureHandoff,
  parseHandoffFragment,
  PROD_APP_URLS,
  resolveAppUrl,
  takePendingHandoff,
} from './handoff'

const tokens = { accessToken: 'acc.tok/en+1', refreshToken: 'ref=resh&2' }

describe('resolveAppUrl', () => {
  it('uses the configured URL without a trailing slash', () => {
    expect(resolveAppUrl('app', 'https://app.example.com/', false)).toBe('https://app.example.com')
  })

  it('trims whitespace', () => {
    expect(resolveAppUrl('panel', '  https://panel.example.com  ', false)).toBe('https://panel.example.com')
  })

  it('falls back to the dev URL when unset in development', () => {
    expect(resolveAppUrl('app', undefined, true)).toBe(DEV_APP_URLS.app)
    expect(resolveAppUrl('panel', '', true)).toBe(DEV_APP_URLS.panel)
  })

  it('falls back to the production URL when unset in production', () => {
    expect(resolveAppUrl('app', undefined, false)).toBe(PROD_APP_URLS.app)
    expect(resolveAppUrl('panel', '   ', false)).toBe(PROD_APP_URLS.panel)
  })

  it('prefers the configured URL over the dev fallback', () => {
    expect(resolveAppUrl('app', 'https://x.test', true)).toBe('https://x.test')
  })
})

describe('buildHandoffUrl', () => {
  it('puts both tokens in the fragment, never in the query', () => {
    const url = new URL(buildHandoffUrl('https://app.example.com', tokens, '/preview'))
    expect(url.pathname).toBe('/preview')
    expect(url.search).toBe('')
    const params = new URLSearchParams(url.hash.slice(1))
    expect(params.get('access_token')).toBe(tokens.accessToken)
    expect(params.get('refresh_token')).toBe(tokens.refreshToken)
  })

  it('defaults to the root path and tolerates trailing slashes / missing leading slash', () => {
    expect(buildHandoffUrl('http://localhost:5173/', tokens).startsWith('http://localhost:5173/#')).toBe(true)
    expect(buildHandoffUrl('http://localhost:5173', tokens, 'choose').startsWith('http://localhost:5173/choose#')).toBe(true)
  })

  it('round-trips through parseHandoffFragment', () => {
    const url = new URL(buildHandoffUrl('https://a.test', tokens))
    expect(parseHandoffFragment(url.hash)).toEqual(tokens)
  })
})

describe('parseHandoffFragment', () => {
  it('parses with or without the leading #', () => {
    expect(parseHandoffFragment('#access_token=a&refresh_token=b')).toEqual({ accessToken: 'a', refreshToken: 'b' })
    expect(parseHandoffFragment('access_token=a&refresh_token=b')).toEqual({ accessToken: 'a', refreshToken: 'b' })
  })

  it('returns null when a token is missing or empty', () => {
    expect(parseHandoffFragment('')).toBeNull()
    expect(parseHandoffFragment('#access_token=a')).toBeNull()
    expect(parseHandoffFragment('#refresh_token=b')).toBeNull()
    expect(parseHandoffFragment('#access_token=&refresh_token=b')).toBeNull()
  })

  it('leaves Supabase invite/recovery fragments alone', () => {
    expect(
      parseHandoffFragment('#access_token=a&expires_in=3600&refresh_token=b&token_type=bearer&type=invite'),
    ).toBeNull()
  })

  it('ignores unrelated fragments', () => {
    expect(parseHandoffFragment('#section-2')).toBeNull()
  })
})

describe('captureHandoff', () => {
  it('stores the tokens and strips the fragment keeping path and query', () => {
    const replaceState = vi.fn()
    const found = captureHandoff(
      { hash: '#access_token=a&refresh_token=b', pathname: '/preview', search: '?x=1' },
      { replaceState },
    )
    expect(found).toBe(true)
    expect(replaceState).toHaveBeenCalledWith(null, '', '/preview?x=1')
    expect(takePendingHandoff()).toEqual({ accessToken: 'a', refreshToken: 'b' })
  })

  it('does nothing when there is no handoff fragment', () => {
    const replaceState = vi.fn()
    expect(captureHandoff({ hash: '', pathname: '/', search: '' }, { replaceState })).toBe(false)
    expect(replaceState).not.toHaveBeenCalled()
  })
})
