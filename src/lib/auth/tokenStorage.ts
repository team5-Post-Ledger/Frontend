import type { User } from '../../types'

const TOKEN_KEY = 'fairpilot.auth.token'
const USER_KEY = 'fairpilot.auth.user'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as User
  } catch {
    // 손상된 값은 다음 부팅 때 또 파싱 실패하지 않도록 즉시 비운다.
    localStorage.removeItem(USER_KEY)
    return null
  }
}

function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clearStoredUser(): void {
  localStorage.removeItem(USER_KEY)
}

export interface StoredSession {
  user: User | null
  token: string | null
}

// authStore 부팅 시 한 번 호출되는 복원 진입점. 지금은 user+token을 함께 localStorage에서 읽지만,
// 백엔드에 실제 /me가 생기면 이 함수만 `{ user: null, token: getToken() }`로 바꾸고 부팅 시 /me
// 재조회로 user를 채우도록 교체하면 된다 — authStore.ts(또는 그 사용처)는 그대로 둔다.
export function restoreSession(): StoredSession {
  return { user: getStoredUser(), token: getToken() }
}

// 로그인 성공 시 세션 저장의 유일한 경로. user·token을 항상 함께 쓴다.
export function persistSession(user: User, token: string): void {
  setStoredUser(user)
  setToken(token)
}

// 로그아웃 시 세션 삭제의 유일한 경로. user·token을 항상 함께 지운다.
export function clearSession(): void {
  clearStoredUser()
  clearToken()
}
