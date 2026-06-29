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

export function usePostAuthRedirect(role: Role | null, delayMs = 700) {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!role) {
      return undefined
    }

    const fromState = location.state as { from?: { pathname?: string } } | null
    const redirectTo = fromState?.from?.pathname ?? ROLE_HOME[role]

    const timer = setTimeout(() => {
      navigate(redirectTo, { replace: true })
    }, delayMs)

    return () => clearTimeout(timer)
  }, [role, location.state, navigate, delayMs])
}
