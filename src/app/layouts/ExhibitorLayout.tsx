import { Link, Outlet, useLocation } from 'react-router'
import { ConsoleHomeLink } from '../../components/ConsoleHomeLink'
import { useAuthStore } from '../../stores/authStore'

function StatsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function ManualIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

function ScannerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 17h7M17 14v7" />
    </svg>
  )
}

const NAV_ITEMS = [
  {
    to: '/exhibitor/stats',
    label: '리포트',
    Icon: StatsIcon,
    isActive: (p: string) => p === '/exhibitor/stats' || p.startsWith('/exhibitor/stats/'),
  },
  {
    to: '/education',
    label: '매뉴얼',
    Icon: ManualIcon,
    isActive: (p: string) => p === '/education' || p.startsWith('/education/'),
  },
  {
    to: '/scanner',
    label: '스캐너',
    Icon: ScannerIcon,
    isActive: (p: string) => p === '/scanner',
  },
]

export function ExhibitorLayout() {
  const { pathname } = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  return (
    <div className="min-h-screen bg-surface text-ink">
      {/* md 이상에서 사이드바+콘텐츠 2열로 전환 */}
      <div className="md:flex md:min-h-screen">

        {/* ─── 좌측 사이드바 (md 이상) ─── */}
        <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-52 md:shrink-0 md:flex-col md:overflow-hidden md:bg-shell md:text-white">
          <Link to="/exhibitor/stats" className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5 transition-opacity hover:opacity-80">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-white/10">
              <span className="h-3.5 w-3.5 rotate-45 bg-primary" />
            </span>
            <div className="leading-tight">
              <div className="text-base font-extrabold tracking-tight text-white">FairPilot</div>
              <div className="text-[11px] font-semibold text-white/55">Exhibitor Console</div>
            </div>
          </Link>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {NAV_ITEMS.map(({ to, label, Icon, isActive }) => (
              <Link
                key={to}
                to={to}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive(pathname)
                    ? 'bg-surface text-ink shadow-sm'
                    : 'text-white/65 hover:bg-white/10 hover:text-white',
                ].join(' ')}
              >
                <Icon />
                {label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-white/10 p-4">
            <ConsoleHomeLink />
          </div>
        </aside>

        {/* ─── 콘텐츠 컬럼 ─── */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* 모바일 전용 헤더 */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-shell px-4 md:hidden">
            <span className="text-base font-extrabold tracking-tight text-white">FairPilot</span>
            <div className="flex items-center gap-2">
              <span className="bg-primary px-2 py-0.5 text-[10px] font-bold text-white">EXHIBITOR</span>
              <span className="text-sm font-semibold text-white/80">{user?.name}</span>
              <Link
                to="/"
                className="ml-1 px-2 py-1 text-sm font-semibold text-white/55 transition-colors hover:text-white"
              >
                메인
              </Link>
              <button
                type="button"
                onClick={logout}
                className="px-2 py-1 text-sm font-semibold text-white/55 transition-colors hover:text-white"
              >
                로그아웃
              </button>
            </div>
          </header>

          {/* md+ 전용 헤더 */}
          <header className="sticky top-0 z-30 hidden h-14 items-center justify-end border-b border-line bg-white px-6 md:flex">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary text-xs font-bold text-white">
                {user?.name?.slice(0, 1) ?? '?'}
              </span>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-ink">{user?.name}</div>
                <div className="text-[11px] text-muted">EXHIBITOR</div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="ml-1 px-2 py-1 text-sm font-semibold text-muted transition-colors hover:bg-surface hover:text-primary"
              >
                로그아웃
              </button>
            </div>
          </header>

          {/* 메인 콘텐츠
              모바일: 하단 탭바 높이만큼 패딩 확보.
              md+: 탭바 없으므로 하단 패딩 0. */}
          <main className="flex-1 pb-[calc(4rem_+_env(safe-area-inset-bottom))] md:pb-0">
            <Outlet />
          </main>
        </div>
      </div>

      {/* ─── 모바일 전용 하단 탭바 (md 이상에서 hidden) ───
          뷰포트 전체 폭 바닥 고정. safe-area 스페이서로 노치 기기 대응. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white md:hidden">
        <div className="grid h-16 grid-cols-3">
          {NAV_ITEMS.map(({ to, label, Icon, isActive }) => (
            <Link
              key={to}
              to={to}
              className={[
                'flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
                isActive(pathname) ? 'text-primary' : 'text-muted',
              ].join(' ')}
            >
              <Icon />
              {label}
            </Link>
          ))}
        </div>
        {/* safe-area 스페이서 */}
        <div className="h-[env(safe-area-inset-bottom)] bg-white" />
      </nav>
    </div>
  )
}
