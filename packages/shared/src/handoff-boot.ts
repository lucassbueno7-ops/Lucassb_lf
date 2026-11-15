// Side-effect module: import it FIRST in each app's main.tsx, before anything that
// creates the Supabase client, so the handoff fragment is captured and stripped
// before supabase-js looks at the URL hash.
import { captureHandoff } from './domain/handoff'

captureHandoff(window.location, window.history)
