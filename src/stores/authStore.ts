import { create } from 'zustand'
import type { User } from '../types'
import { clearSession, persistSession, restoreSession } from '../lib/auth'
import { useCurrentExhibitionStore } from './currentExhibitionStore'
import { useStaffExhibitionStore } from './staffExhibitionStore'

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
    // 다른 사용자가 로그인했을 때 이전 사용자가 고른 행사가 남지 않도록 역할별 행사 선택을 모두 초기화한다.
    useCurrentExhibitionStore.getState().setExhibitionId(null)
    useStaffExhibitionStore.getState().setExhibitionId(null)
    set({ user: null, token: null })
  },
}))
