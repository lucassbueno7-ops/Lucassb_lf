import { Button, Card } from '../ui/ui'
import { useAuth } from './auth-context'

interface Props {
  title: string
  message: string
  /** Optional link to the app this user should be using instead. */
  href?: string
  linkLabel?: string
}

/** Full-page notice shown when a user signs into the wrong app for their role. */
export function WrongAppNotice({ title, message, href, linkLabel }: Props) {
  const { signOut } = useAuth()
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-4">
      <Card title={title}>
        <div className="space-y-3">
          <p className="text-sm text-slate-600">{message}</p>
          {href && (
            <a href={href} className="block text-sm font-medium text-teal-700 underline">
              {linkLabel ?? href}
            </a>
          )}
          <Button variant="secondary" className="w-full" onClick={() => void signOut()}>
            Cerrar sesión
          </Button>
        </div>
      </Card>
    </div>
  )
}
