import { Outlet } from 'react-router'
import { ConsoleTopBar, type ConsoleNavItem } from '../../components/ConsoleTopBar'
import { useAuthStore } from '../../stores/authStore'

// '/platform/exhibitions'는 상세('/platform/exhibitions/:id')와 접두사가 겹치지 않게
// end로 정확 매칭한다(기존 동작 유지).
const NAV_ITEMS: ConsoleNavItem[] = [
  { to: '/platform/exhibitions', label: '전체 행사', end: true },
  { to: '/platform/admins', label: 'EXPO_ADMIN' },
  { to: '/platform/accountants', label: 'ACCOUNTANT' },
  { to: '/platform/ads', label: '광고' },
  { to: '/platform/stats', label: '통합 통계' },
]

export function PlatformLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <ConsoleTopBar
        homeTo="/platform/exhibitions"
        consoleName="Platform Console"
        primaryNav={NAV_ITEMS}
        user={{ name: user?.name, role: user?.role }}
        onLogout={logout}
        mainSiteHref="/"
      />

      <main className="min-w-0 flex-1 bg-surface p-6">
        <div className="min-h-full border border-line bg-white p-6 shadow-sm">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
