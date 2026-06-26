import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '../../stores/authStore'

const NAV_LINKS = [
  { to: '/exhibitions', label: '박람회' },
  { to: '/my/route', label: 'AI 동선' },
  { to: '/assistant', label: 'AI 도우미' },
  { to: '/my', label: '내 예약' },
]

// '/my'는 '/my/route'(별도 nav 항목)와 접두사가 겹친다. '/my/route'를 제외한
// '/my' 하위 경로(예약·티켓 등)에서만 활성화되도록 직접 판정한다.
function isMyHubActive(pathname: string) {
  return pathname === '/my' || (pathname.startsWith('/my/') && !pathname.startsWith('/my/route'))
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  )
}

function ExploreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
    </svg>
  )
}

const TAB_ITEMS = [
  { to: '/', label: '홈', end: true, icon: HomeIcon },
  { to: '/exhibitions', label: '박람회', end: false, icon: ExploreIcon },
  { to: '/my/route', label: 'AI 동선', end: false, icon: SparkleIcon },
  { to: '/assistant', label: 'AI 도우미', end: false, icon: ChatIcon },
  { to: '/my', label: '내정보', end: false, icon: UserIcon },
]

export function VisitorLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:h-16 lg:px-8">
        <Link to="/" className="text-lg font-extrabold tracking-tight text-primary lg:text-xl">
          FairPilot
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => {
            if (link.to === '/my') {
              const isActive = isMyHubActive(location.pathname)
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={isActive ? 'page' : undefined}
                  className={`text-sm font-semibold transition-colors ${isActive ? 'text-primary' : 'text-muted hover:text-ink'}`}
                >
                  {link.label}
                </Link>
              )
            }
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-semibold transition-colors ${isActive ? 'text-primary' : 'text-muted hover:text-ink'}`
                }
              >
                {link.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <span className="text-sm font-semibold text-ink">{user.name}님</span>
              <button
                type="button"
                onClick={logout}
                className="text-sm font-semibold text-muted transition-colors hover:text-primary"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-muted transition-colors hover:text-ink">
                로그인
              </Link>
              <Link
                to="/signup"
                className="flex h-9 items-center justify-center bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
              >
                가입하기
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center lg:hidden">
          {user ? (
            <span className="flex h-8 w-8 items-center justify-center bg-primary text-xs font-bold text-white">
              {user.name.slice(0, 1)}
            </span>
          ) : (
            <Link to="/login" className="text-sm font-semibold text-primary">
              로그인
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 pb-16 lg:pb-0">
        <div className="mx-auto w-full max-w-7xl">
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-5 border-t border-line bg-white lg:hidden">
        {TAB_ITEMS.map((item) => {
          const Icon = item.icon

          if (item.to === '/my') {
            const isActive = isMyHubActive(location.pathname)
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
                  isActive ? 'text-primary' : 'text-muted',
                ].join(' ')}
              >
                <Icon />
                {item.label}
              </Link>
            )
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
                  isActive ? 'text-primary' : 'text-muted',
                ].join(' ')
              }
            >
              <Icon />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
