import { create } from 'zustand'
import type { AuthUser } from '../types'
import { clearSession, getRefreshToken, persistSession, restoreSession } from '../lib/auth'
import { logout as apiLogout } from '../lib/api/auth'
import { useCurrentExhibitionStore } from './currentExhibitionStore'
import { useStaffExhibitionStore } from './staffExhibitionStore'

interface AuthState {
  user: AuthUser | null
  token: string | null
  login: (user: AuthUser, token: string, refreshToken?: string | null) => void
  logout: () => void
}

const initialSession = restoreSession()

export const useAuthStore = create<AuthState>((set) => ({
  user: initialSession.user,
  token: initialSession.token,
  login: (user, token, refreshToken = null) => {
    // 이전 세션(토큰·user·역할 스코프 persist 키)을 완전히 제거한 뒤 새 세션을 기록한다.
    clearSession()
    useCurrentExhibitionStore.getState().setExhibitionId(null)
    useStaffExhibitionStore.getState().setExhibitionId(null)
    persistSession(user, token, refreshToken)
    set({ user, token })
  },
  logout: () => {
    // 클라이언트 세션을 지우기 전에 서버 refreshToken을 무효화한다(best-effort, 결과를 기다리지 않음).
    void apiLogout(getRefreshToken())
    clearSession()
    // 다른 사용자가 로그인했을 때 이전 사용자가 고른 행사가 남지 않도록 역할별 행사 선택을 모두 초기화한다.
    useCurrentExhibitionStore.getState().setExhibitionId(null)
    useStaffExhibitionStore.getState().setExhibitionId(null)
    set({ user: null, token: null })
  },
}))
