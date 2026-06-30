import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { Role } from '../types'

export const ROLE_HOME: Record<Role, string> = {
  VISITOR: '/',
  EXPO_ADMIN: '/admin',
  PLATFORM_ADMIN: '/platform/exhibitions',
  ACCOUNTANT: '/settlements',
  STAFF: '/checkin',
  EXHIBITOR: '/exhibitor/stats',
}

// state.from이 이 경로이면 리다이렉트 루프 / 에러 루프가 생기므로 폴백한다.
const BLOCK_PATHS = new Set(['/login', '/signup', '/403'])

// ROLE_HOME에서 파생한 역할별 첫 번째 경로 세그먼트. 별도 역할 표가 아니라 ROLE_HOME 파생값이다.
// 한계: STAFF의 /education/*, EXHIBITOR의 /scanner/* · /education/* 는 prefix 미포함이라
// 해당 경로에서 세션 만료 후 재로그인하면 state.from이 버려지고 role home으로 이동한다(403 아님).
const ROLE_PREFIX = Object.fromEntries(
  (Object.entries(ROLE_HOME) as [Role, string][]).map(([role, path]) => {
    const seg = path.split('/').filter(Boolean)[0]
    return [role, seg ? `/${seg}` : '/']
  }),
) as Record<Role, string>

function isFromAccessible(from: string, role: Role): boolean {
  if (BLOCK_PATHS.has(from)) return false

  const prefix = ROLE_PREFIX[role]
  if (prefix === '/') {
    // VISITOR: from이 다른 역할의 전용 prefix로 시작하지 않으면 접근 가능으로 판정.
    // otherPrefixes는 ROLE_PREFIX에서 파생 — 별도 역할 목록 없음.
    const otherPrefixes = Object.values(ROLE_PREFIX).filter((p) => p !== '/')
    return !otherPrefixes.some((p) => from.startsWith(p))
  }

  return from.startsWith(prefix)
}

export function usePostAuthRedirect(role: Role | null, delayMs = 700) {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!role) {
      return undefined
    }

    const fromPathname = (location.state as { from?: { pathname?: string } } | null)
      ?.from?.pathname

    const redirectTo =
      fromPathname && isFromAccessible(fromPathname, role) ? fromPathname : ROLE_HOME[role]

    const timer = setTimeout(() => {
      navigate(redirectTo, { replace: true })
    }, delayMs)

    return () => clearTimeout(timer)
  }, [role, location.state, navigate, delayMs])
}
