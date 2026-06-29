import { Link, NavLink, Outlet } from 'react-router'
import { useAuthStore } from '../../stores/authStore'

const NAV_LINKS = [
  { to: '/exhibitor/stats', label: '리포트' },
  { to: '/education', label: '매뉴얼' },
  { to: '/scanner', label: '스캐너' },
]

export function ExhibitorLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-shell">
        {/* 브랜드 + 네비(PC) + 로그아웃 */}
        <div className="flex h-14 items-center justify-between px-4">
          <Link
            to="/exhibitor/stats"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-white/10">
              <span className="h-3 w-3 rotate-45 bg-primary" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-tight text-white">FairPilot</div>
              <div className="text-[10px] font-semibold text-white/55">Exhibitor Console</div>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            {/* 네비 링크 — sm 이상에서 인라인 */}
            <nav className="hidden items-center sm:flex">
              {NAV_LINKS.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    [
                      'px-3 py-2 text-sm font-semibold transition-colors',
                      isActive ? 'text-white' : 'text-white/55 hover:text-white',
                    ].join(' ')
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2 border-l border-white/10 pl-3">
              <span className="hidden text-sm text-white/80 sm:block">{user?.name}</span>
              <button
                type="button"
                onClick={logout}
                className="text-sm font-semibold text-white/55 transition-colors hover:text-white"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>

        {/* 모바일 전용 네비 탭 (sm 미만) */}
        <nav className="flex border-t border-white/10 sm:hidden">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex-1 py-2.5 text-center text-xs font-semibold transition-colors',
                  isActive
                    ? 'border-b-2 border-primary text-white'
                    : 'text-white/55 hover:text-white',
                ].join(' ')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}
