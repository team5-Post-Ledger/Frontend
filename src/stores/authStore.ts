import { create } from 'zustand'
import type { User } from '../types'
import { clearToken, getToken, setToken } from '../lib/auth'

interface AuthState {
  user: User | null
  token: string | null
  login: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getToken(),
  login: (user, token) => {
    setToken(token)
    set({ user, token })
  },
  logout: () => {
    clearToken()
    set({ user: null, token: null })
  },
}))
