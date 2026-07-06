import type { AuthUser } from '../../types'

const LEGACY_TOKEN_KEY = 'fairpilot.auth.token'
const ACCESS_TOKEN_KEY = 'fairpilot.auth.accessToken'
const REFRESH_TOKEN_KEY = 'fairpilot.auth.refreshToken'
const USER_KEY = 'fairpilot.auth.user'
// zustand/persist가 관리하는 역할 스코프 키 — 로그아웃/로그인 시 제거해 다음 사용자에게 누수를 막는다.
const ADMIN_EXHIBITION_KEY = 'fairpilot.admin.currentExhibitionId'
const STAFF_EXHIBITION_KEY = 'fairpilot.staff.currentExhibitionId'

export function getToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY)
}

function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

function setRefreshToken(refreshToken: string | null): void {
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
}

function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    // 손상된 값은 다음 부팅 때 또 파싱 실패하지 않도록 즉시 비운다.
    localStorage.removeItem(USER_KEY)
    return null
  }
}

function setStoredUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clearStoredUser(): void {
  localStorage.removeItem(USER_KEY)
}

export interface StoredSession {
  user: AuthUser | null
  token: string | null
  refreshToken: string | null
}

// authStore 부팅 시 한 번 호출되는 복원 진입점. 지금은 user+token을 함께 localStorage에서 읽지만,
// 백엔드에 실제 /me가 생기면 이 함수만 `{ user: null, token: getToken() }`로 바꾸고 부팅 시 /me
// 재조회로 user를 채우도록 교체하면 된다 — authStore.ts(또는 그 사용처)는 그대로 둔다.
export function restoreSession(): StoredSession {
  const user = getStoredUser()
  const token = getToken()
  const refreshToken = getRefreshToken()
  // token·user 중 하나라도 없으면 불완전 세션(비정상 종료·부분 로그아웃) → 양쪽 모두 제거 후 미인증 반환.
  if (!user || !token) {
    clearTokens()
    clearStoredUser()
    return { user: null, token: null, refreshToken: null }
  }
  return { user, token, refreshToken }
}

// 로그인 성공 시 세션 저장의 유일한 경로. user·token을 항상 함께 쓴다.
export function persistSession(user: AuthUser, token: string, refreshToken: string | null = null): void {
  setStoredUser(user)
  setAccessToken(token)
  setRefreshToken(refreshToken)
}

// 로그아웃 시 세션 삭제의 유일한 경로. user·token·역할 스코프 persist 키를 함께 지운다.
export function clearSession(): void {
  clearStoredUser()
  clearTokens()
  localStorage.removeItem(ADMIN_EXHIBITION_KEY)
  localStorage.removeItem(STAFF_EXHIBITION_KEY)
}
