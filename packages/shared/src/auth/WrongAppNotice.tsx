import { ExternalLink } from 'lucide-react'
import { Button } from '../ui/button'
import { AuthShell } from './AuthShell'
import { useAuth } from './auth-context'

interface Props {
  title: string
  message: string
  /** Optional link to the app this user should be using instead. */
  href?: string | null
  linkLabel?: string
}

/** Full-page notice shown when a user signs into the wrong app for their role. */
export function WrongAppNotice({ title, message, href, linkLabel }: Props) {
  const { signOut } = useAuth()
  return (
    <AuthShell title={title}>
      <div className="space-y-4">
        <p className="text-center text-sm text-muted-foreground">{message}</p>
        {href && (
          <Button asChild className="w-full">
            <a href={href}>
              {linkLabel ?? href}
              <ExternalLink aria-hidden />
            </a>
          </Button>
        )}
        <Button variant="outline" className="w-full" onClick={() => void signOut()}>
          Cerrar sesión
        </Button>
      </div>
    </AuthShell>
  )
}
