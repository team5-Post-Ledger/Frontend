import { create } from 'zustand'
import type { User } from '../types'
import { clearSession, persistSession, restoreSession } from '../lib/auth'

interface AuthState {
  user: User | null
  token: string | null
  login: (user: User, token: string) => void
  logout: () => void
}

const initialSession = restoreSession()

export const useAuthStore = create<AuthState>((set) => ({
  user: initialSession.user,
  token: initialSession.token,
  login: (user, token) => {
    persistSession(user, token)
    set({ user, token })
  },
  logout: () => {
    clearSession()
    set({ user: null, token: null })
  },
}))
