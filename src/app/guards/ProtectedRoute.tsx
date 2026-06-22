import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '../../stores/authStore'
import type { Role } from '../../types'

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}
