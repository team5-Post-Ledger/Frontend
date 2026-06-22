import { NavLink, Outlet } from 'react-router'
import { useCurrentExhibition } from '../../features/exhibition/hooks'
import { useAuthStore } from '../../stores/authStore'
import type { ExhibitionStatus } from '../../types'

const NAV_ITEMS = [
  { to: '/admin/reservations', label: '예약 관리' },
  { to: '/admin/checkin', label: '체크인' },
  { to: '/admin/nametags', label: '네임태그' },
  { to: '/admin/staff', label: '스태프' },
  { to: '/admin/exhibitors', label: '참가기업' },
  { to: '/admin/booths', label: '부스' },
  { to: '/admin/sessions', label: '세션' },
  { to: '/admin/time-slots', label: '슬롯' },
  { to: '/admin/ticket-types', label: '티켓' },
  { to: '/admin/stats', label: '통계' },
  { to: '/admin/education', label: 'LMS' },
]

const STATUS_LABEL: Record<ExhibitionStatus, string> = {
  DRAFT: '준비중',
  OPEN: '진행중',
  CLOSED: '종료',
}

const STATUS_BADGE_CLASS: Record<ExhibitionStatus, string> = {
  DRAFT: 'bg-warning text-white',
  OPEN: 'bg-success text-white',
  CLOSED: 'bg-line text-muted',
}

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const pad = (value: number) => String(value).padStart(2, '0')
  const startLabel = `${start.getFullYear()}.${pad(start.getMonth() + 1)}.${pad(start.getDate())}`
  const endLabel = `${pad(end.getMonth() + 1)}.${pad(end.getDate())}`
  return `${startLabel} – ${endLabel}`
}

export function AdminLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const exhibition = useCurrentExhibition()

  return (
    <div className="flex min-h-screen bg-surface text-ink">
      <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-white">
        <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
          <span className="h-5 w-5 rotate-45 rounded-md bg-accent" />
          <span className="text-lg font-extrabold tracking-tight text-ink">FairPilot</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-muted hover:bg-surface hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-line'}`} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line px-4 py-3 text-xs text-muted">v1.0 · 운영자 콘솔</div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-line bg-white px-6">
          <div className="flex items-center gap-3">
            {exhibition.isLoading ? (
              <span className="text-sm text-muted">불러오는 중...</span>
            ) : exhibition.isError || !exhibition.data ? (
              <span className="text-sm text-muted">행사 정보를 불러오지 못했습니다.</span>
            ) : (
              <>
                <span className="text-base font-bold text-ink">{exhibition.data.title}</span>
                <span className="text-xs text-muted">
                  {formatDateRange(exhibition.data.startDate, exhibition.data.endDate)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_BADGE_CLASS[exhibition.data.status]}`}
                >
                  {STATUS_LABEL[exhibition.data.status]}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="알림"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-muted hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>

            <div className="flex items-center gap-2.5 border-l border-line pl-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {user?.name?.slice(0, 1) ?? '?'}
              </span>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-ink">{user?.name ?? '-'}</div>
                <div className="text-xs text-muted">{user?.role}</div>
              </div>
              <button type="button" onClick={logout} className="ml-2 text-sm text-muted hover:text-ink">
                로그아웃
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
