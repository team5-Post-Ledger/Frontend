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
  OPEN: 'bg-live text-ink',
  CLOSED: 'bg-line text-muted',
}

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const pad = (value: number) => String(value).padStart(2, '0')

  const startLabel = `${start.getFullYear()}.${pad(start.getMonth() + 1)}.${pad(
      start.getDate(),
  )}`
  const endLabel = `${pad(end.getMonth() + 1)}.${pad(end.getDate())}`

  return `${startLabel} – ${endLabel}`
}

export function AdminLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const exhibition = useCurrentExhibition()

  return (
      <div className="flex min-h-screen bg-surface text-ink">
        {/* Left Sidebar */}
        <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col overflow-hidden bg-shell text-white">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center bg-white/10">
             <span className="h-3.5 w-3.5 rotate-45 bg-primary" />
            </span>

              <div className="leading-tight">
                <div className="text-lg font-extrabold tracking-tight text-white">FairPilot</div>
                <div className="text-[11px] font-semibold text-white/55">Admin Console</div>
              </div>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {NAV_ITEMS.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                        [
                          'group flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-colors',
                          isActive
                              ? 'bg-surface shadow-sm'
                              : 'text-white/65 hover:bg-white/10 hover:text-white',
                        ].join(' ')
                    }
                >
                  {({ isActive }) => (
                      <>
                  <span
                      className={[
                        'h-1.5 w-1.5 shrink-0 rounded-full transition-colors',
                        isActive ? 'bg-live' : 'bg-white/35 group-hover:bg-accent',
                      ].join(' ')}
                  />
                        <span className={isActive ? 'text-ink' : ''}>{item.label}</span>
                      </>
                  )}
                </NavLink>
            ))}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="bg-white/10 px-3 py-2">
              <div className="text-xs font-bold text-white">v1.0</div>
              <div className="mt-0.5 text-xs text-white/55">Fair operation system</div>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white px-6">
            <div className="flex min-w-0 items-center gap-3">
              {exhibition.isLoading ? (
                  <span className="text-sm text-muted">불러오는 중...</span>
              ) : exhibition.isError || !exhibition.data ? (
                  <span className="text-sm text-muted">행사 정보를 불러오지 못했습니다.</span>
              ) : (
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-extrabold text-ink">
                        {exhibition.data.title}
                      </div>
                      <div className="mt-0.5 text-xs font-medium text-muted">
                        {formatDateRange(exhibition.data.startDate, exhibition.data.endDate)}
                      </div>
                    </div>

                    <span
                        className={[
                          'shrink-0 px-2.5 py-1 text-xs font-bold',
                          STATUS_BADGE_CLASS[exhibition.data.status],
                        ].join(' ')}
                    >
                  {STATUS_LABEL[exhibition.data.status]}
                </span>
                  </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                  type="button"
                  aria-label="알림"
                  className="flex h-9 w-9 items-center justify-center border border-line bg-white text-muted transition-colors hover:border-accent hover:text-primary"
              >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>

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
                    className="ml-1 px-2 py-1 text-sm font-semibold text-muted transition-colors hover:bg-surface hover:text-primary"
                >
                  로그아웃
                </button>
              </div>
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