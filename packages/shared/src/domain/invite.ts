export type InviteLinkType = 'invite' | 'recovery'

export interface InviteParams {
  tokenHash: string
  type: InviteLinkType
}

/**
 * Reads `?token_hash=...&type=invite|recovery` from an invite link. The token is only
 * verified when the person presses a button, so chat link previews (WhatsApp, mail
 * scanners) that fetch the URL cannot consume the one-time token.
 */
export function parseInviteParams(search: string): InviteParams | null {
  const params = new URLSearchParams(search)
  const tokenHash = params.get('token_hash')?.trim()
  const type = params.get('type')
  if (!tokenHash || (type !== 'invite' && type !== 'recovery')) return null
  return { tokenHash, type }
}

/** Text a trainer shares with a new client. */
export function buildInviteMessage(name: string, link: string): string {
  const who = name.trim()
  const greeting = who ? `Hola ${who}!` : 'Hola!'
  return `${greeting} Te invito a la app de entrenamiento de Lucas Bueno. Entrá a este link para crear tu contraseña: ${link}`
}

/** wa.me deep link that opens WhatsApp with `text` prefilled (contact is picked by the user). */
export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}
