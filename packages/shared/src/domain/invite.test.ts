import { describe, expect, it } from 'vitest'
import { buildInviteMessage, parseInviteParams, whatsappShareUrl } from './invite'

describe('parseInviteParams', () => {
  it('reads an invite token hash', () => {
    expect(parseInviteParams('?token_hash=abc123&type=invite')).toEqual({ tokenHash: 'abc123', type: 'invite' })
  })

  it('reads a recovery token hash', () => {
    expect(parseInviteParams('?token_hash=xyz&type=recovery')).toEqual({ tokenHash: 'xyz', type: 'recovery' })
  })

  it('rejects a missing token or an unsupported type', () => {
    expect(parseInviteParams('')).toBeNull()
    expect(parseInviteParams('?type=invite')).toBeNull()
    expect(parseInviteParams('?token_hash=abc&type=signup')).toBeNull()
    expect(parseInviteParams('?token_hash=abc')).toBeNull()
  })
})

describe('buildInviteMessage', () => {
  it('greets the client by name and includes the link', () => {
    expect(buildInviteMessage('Ana', 'https://x.test/set-password#a=b')).toBe(
      'Hola Ana! Te invito a la app de entrenamiento de Lucas Bueno. Entrá a este link para crear tu contraseña: https://x.test/set-password#a=b',
    )
  })

  it('trims the name and falls back to a plain greeting when empty', () => {
    expect(buildInviteMessage('  Ana  ', 'l')).toContain('Hola Ana!')
    expect(buildInviteMessage('   ', 'l').startsWith('Hola! Te invito')).toBe(true)
  })
})

describe('whatsappShareUrl', () => {
  it('encodes the text for wa.me', () => {
    const url = whatsappShareUrl('Hola Ana! a&b=c #1')
    expect(url.startsWith('https://wa.me/?text=')).toBe(true)
    expect(new URL(url).searchParams.get('text')).toBe('Hola Ana! a&b=c #1')
  })
})
