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
