import { create } from 'zustand'
import type { User } from '../types'
import { clearSession, persistSession, restoreSession } from '../lib/auth'
import { useCurrentExhibitionStore } from './currentExhibitionStore'

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
    // 같은 브라우저에서 다른 EXPO_ADMIN이 로그인했을 때 이전 사용자가 고른 행사가 남아있으면
    // 담당 아닌 행사 데이터가 노출될 수 있어 선택도 함께 비운다.
    useCurrentExhibitionStore.getState().setExhibitionId(null)
    set({ user: null, token: null })
  },
}))
