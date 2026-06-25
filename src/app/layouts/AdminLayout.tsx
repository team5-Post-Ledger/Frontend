import { Link, NavLink, Outlet } from 'react-router'
import { useCurrentExhibition } from '../../features/exhibition/hooks'
import { formatDateRange } from '../../lib/format'
import { useAuthStore } from '../../stores/authStore'
import { useCurrentExhibitionStore } from '../../stores/currentExhibitionStore'
import type { ExhibitionStatus } from '../../types'

interface NavItem {
  to: string
  label: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

// §10.2 EXPO_ADMIN 화면 중 화면이 실제로 있는 것만 묶는다. 동선흐름(/admin/stats/flow)·
// LMS(/admin/education*)는 화면 미구현이라 항목을 넣지 않는다(넣으면 Stub로 빠짐) — 화면이
// 생기면 그때 추가한다. 예약 상세·명단추출도 사이드바에 넣지 않는다(목록 행 클릭·예약관리 내
// 버튼이 정석 진입로).
const NAV_GROUPS: NavGroup[] = [
  {
    label: '운영',
    items: [
      { to: '/admin/reservations', label: '예약 관리' },
      { to: '/admin/checkin', label: '체크인' },
    ],
  },
  {
    label: '마스터',
    items: [
      { to: '/admin/booths', label: '부스' },
      { to: '/admin/sessions', label: '세션' },
      { to: '/admin/time-slots', label: '슬롯' },
      { to: '/admin/ticket-types', label: '티켓' },
      { to: '/admin/nametags', label: '네임태그' },
    ],
  },
  {
    label: '인력',
    items: [
      { to: '/admin/staff', label: '스태프' },
      { to: '/admin/exhibitors', label: '참가기업' },
    ],
  },
  {
    label: '분석',
    items: [{ to: '/admin/stats', label: '통계' }],
  },
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

const NAV_LINK_CLASS = ({ isActive }: { isActive: boolean }) =>
  [
    'group flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-colors',
    isActive ? 'bg-surface shadow-sm' : 'text-white/65 hover:bg-white/10 hover:text-white',
  ].join(' ')

export function AdminLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const exhibitionId = useCurrentExhibitionStore((state) => state.exhibitionId)
  const exhibition = useCurrentExhibition()

  return (
      <div className="flex min-h-screen bg-surface text-ink">
        {/* Left Sidebar */}
        <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col overflow-hidden bg-shell text-white">
          <Link to="/admin" className="border-b border-white/10 px-5 py-5 transition-colors hover:bg-white/5">
            <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center bg-white/10">
             <span className="h-3.5 w-3.5 rotate-45 bg-primary" />
            </span>

              <div className="leading-tight">
                <div className="text-lg font-extrabold tracking-tight text-white">FairPilot</div>
                <div className="text-[11px] font-semibold text-white/55">Admin Console</div>
              </div>
            </div>
          </Link>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {NAV_GROUPS.map((group, groupIndex) => (
              <div key={group.label} className={groupIndex > 0 ? 'mt-3' : undefined}>
                <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/35">{group.label}</div>

                {group.label === '운영' &&
                  (exhibitionId !== null ? (
                    <NavLink to={`/admin/exhibitions/${exhibitionId}`} className={NAV_LINK_CLASS}>
                      {({ isActive }) => <NavRowContent isActive={isActive} label="운영 대시보드" />}
                    </NavLink>
                  ) : (
                    <Link
                      to="/admin"
                      className="group flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-white/35 transition-colors hover:bg-white/10 hover:text-white/60"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/20" />
                      <span>운영 대시보드</span>
                      <span className="ml-auto text-[10px] font-normal text-white/30">행사 선택 필요</span>
                    </Link>
                  ))}

                {group.items.map((item) => (
                  <NavLink key={item.to} to={item.to} className={NAV_LINK_CLASS}>
                    {({ isActive }) => <NavRowContent isActive={isActive} label={item.label} />}
                  </NavLink>
                ))}
              </div>
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
              {exhibitionId === null ? (
                  <Link to="/admin" className="text-sm font-semibold text-primary hover:text-primary-hover">
                    행사를 선택해주세요 →
                  </Link>
              ) : exhibition.isLoading ? (
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

                    <Link to="/admin" className="shrink-0 text-xs font-semibold text-muted transition-colors hover:text-primary">
                      행사 변경
                    </Link>
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
