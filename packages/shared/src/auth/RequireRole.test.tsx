import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Session } from '@supabase/supabase-js'
import { AuthContext, type AuthState, type Profile } from './auth-context'
import { RequireRole } from './RequireRole'

const fakeSession = { user: { id: 'u1' } } as unknown as Session
const profile = (role: Profile['role']): Profile => ({ id: 'u1', role, full_name: 'Test', height_cm: null, trainer_id: null })

function renderAt(state: Partial<AuthState>, required: 'trainer' | 'client') {
  const value: AuthState = {
    session: null,
    profile: null,
    loading: false,
    signOut: async () => {},
    refreshProfile: async () => {},
    ...state,
  }
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<RequireRole role={required} wrongRole={<p>wrong app</p>} />}>
            <Route path="/protected" element={<p>secret</p>} />
          </Route>
          <Route path="/login" element={<p>login page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('RequireRole', () => {
  it('shows a loading state while auth resolves', () => {
    renderAt({ loading: true }, 'trainer')
    expect(screen.getByText(/cargando/i)).toBeInTheDocument()
    expect(screen.queryByText('secret')).not.toBeInTheDocument()
  })

  it('redirects anonymous users to /login', () => {
    renderAt({}, 'trainer')
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('renders the content when the role matches', () => {
    renderAt({ session: fakeSession, profile: profile('trainer') }, 'trainer')
    expect(screen.getByText('secret')).toBeInTheDocument()
  })

  it('shows the wrong-app fallback to a client on a trainer route', () => {
    renderAt({ session: fakeSession, profile: profile('client') }, 'trainer')
    expect(screen.getByText('wrong app')).toBeInTheDocument()
    expect(screen.queryByText('secret')).not.toBeInTheDocument()
  })

  it('shows the wrong-app fallback to a trainer on a client route', () => {
    renderAt({ session: fakeSession, profile: profile('trainer') }, 'client')
    expect(screen.getByText('wrong app')).toBeInTheDocument()
  })
})
