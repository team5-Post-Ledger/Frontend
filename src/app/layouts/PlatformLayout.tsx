import { Link, NavLink, Outlet } from 'react-router'
import { useAuthStore } from '../../stores/authStore'

interface NavItem {
  to: string
  label: string
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/platform/exhibitions', label: '전체 행사', end: true },
  { to: '/platform/admins', label: 'EXPO_ADMIN' },
  { to: '/platform/accountants', label: 'ACCOUNTANT' },
  { to: '/platform/ads', label: '광고' },
  { to: '/platform/stats', label: '통합 통계' },
]

const NAV_LINK_CLASS = ({ isActive }: { isActive: boolean }) =>
  [
    'group flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    isActive ? 'bg-surface shadow-sm' : 'text-white/65 hover:bg-white/10 hover:text-white',
  ].join(' ')

function NavRowContent({ isActive, label }: { isActive: boolean; label: string }) {
  return (
    <>
      <span
        className={[
          'h-1.5 w-1.5 shrink-0 rounded-full transition-colors',
          isActive ? 'bg-live' : 'bg-white/35 group-hover:bg-accent',
        ].join(' ')}
      />
      <span className={isActive ? 'text-ink' : ''}>{label}</span>
    </>
  )
}

export function PlatformLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  return (
    <div className="flex min-h-screen bg-surface text-ink">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col overflow-hidden bg-shell text-white">
        <Link
          to="/platform/exhibitions"
          className="border-b border-white/10 px-5 py-5 transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center bg-white/10">
              <span className="h-3.5 w-3.5 rotate-45 bg-primary" />
            </span>

            <div className="leading-tight">
              <div className="text-lg font-extrabold tracking-tight text-white">FairPilot</div>
              <div className="text-[11px] font-semibold text-white/55">Platform Console</div>
            </div>
          </div>
        </Link>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/35">플랫폼</div>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={NAV_LINK_CLASS}>
              {({ isActive }) => <NavRowContent isActive={isActive} label={item.label} />}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <Link
            to="/"
            className="mb-3 flex items-center gap-1 text-xs font-semibold text-white/45 transition-colors hover:text-white/80"
          >
            ← 메인 사이트
          </Link>
          <div className="bg-white/10 px-3 py-2">
            <div className="text-xs font-bold text-white">api-admin</div>
            <div className="mt-0.5 text-xs text-white/55">Platform administration</div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white px-6">
          <div className="min-w-0">
            <div className="truncate text-base font-extrabold text-ink">플랫폼 관리</div>
            <div className="mt-0.5 text-xs font-medium text-muted">전체 행사와 운영 계정을 관리합니다.</div>
          </div>

          <div className="flex items-center gap-2.5 border-l border-line pl-3">
            <span className="flex h-8 w-8 items-center justify-center bg-primary text-xs font-bold text-white">
              {user?.name?.slice(0, 1) ?? '?'}
            </span>

            <div className="hidden leading-tight sm:block">
              <div className="text-sm font-semibold text-ink">{user?.name ?? '-'}</div>
              <div className="text-xs text-muted">{user?.role}</div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="ml-1 px-2 py-1 text-sm font-semibold text-muted transition-colors hover:bg-surface hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              로그아웃
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 bg-surface p-6">
          <div className="min-h-full border border-line bg-white p-6 shadow-sm">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
