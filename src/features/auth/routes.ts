import type { Role } from '../../domain/types'

export const homePathForRole = (role: Role): string => (role === 'trainer' ? '/trainer' : '/app')
