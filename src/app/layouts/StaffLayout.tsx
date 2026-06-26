import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { useMyStaffExhibitions } from '../../features/staffExhibition/hooks'
import { useAuthStore } from '../../stores/authStore'
import { useStaffExhibitionStore } from '../../stores/staffExhibitionStore'

function CheckinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 17h7M17 14v7" />
    </svg>
  )
}

function EducationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

function BadgeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  )
}

// 각 탭의 active 판정 함수. 동일 로직을 레일(md+)과 하단 탭바(mobile) 양쪽에 재사용한다.
//
// 체크인: /checkin 및 모든 하위 경로(/checkin/qr, /checkin/reservations/:id/status 등)
// 교육:   /education 하위 중 자격(/education/progress)은 제외
// 자격:   /education/progress 정확 일치만
const NAV_ITEMS = [
  {
    to: '/checkin/qr',
    label: '체크인',
    Icon: CheckinIcon,
    isActive: (p: string) => p === '/checkin' || p.startsWith('/checkin/'),
  },
  {
    to: '/education',
    label: '교육',
    Icon: EducationIcon,
    isActive: (p: string) =>
      (p === '/education' || p.startsWith('/education/')) && !p.startsWith('/education/progress'),
  },
  {
    to: '/education/progress',
    label: '자격 현황',
    Icon: BadgeIcon,
    isActive: (p: string) => p === '/education/progress',
  },
]

export function StaffLayout() {
  const { pathname } = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const exhibitionId = useStaffExhibitionStore((state) => state.exhibitionId)
  const setExhibitionId = useStaffExhibitionStore((state) => state.setExhibitionId)
  const navigate = useNavigate()
  const exhibitionsQuery = useMyStaffExhibitions()
  const currentExhibition = exhibitionsQuery.data?.find((ex) => ex.id === exhibitionId) ?? null
  const hasMultipleExhibitions = (exhibitionsQuery.data?.length ?? 0) > 1

  function handleChangeExhibition() {
    setExhibitionId(null)
    navigate('/checkin')
  }

  return (
    <div className="min-h-screen bg-surface text-ink">
      {/* md 이상에서 레일+콘텐츠 2열로 전환 */}
      <div className="md:flex md:min-h-screen">

        {/* ─── 좌측 네비 레일 (md 이상) ─── */}
        <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-52 md:shrink-0 md:flex-col md:overflow-hidden md:bg-shell md:text-white">
          {/* 브랜드 마크 */}
          <Link to="/checkin" className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5 transition-opacity hover:opacity-80">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-white/10">
              <span className="h-3.5 w-3.5 rotate-45 bg-primary" />
            </span>
            <div className="leading-tight">
              <div className="text-base font-extrabold tracking-tight text-white">FairPilot</div>
              <div className="text-[11px] font-semibold text-white/55">Staff Console</div>
            </div>
          </Link>

          {/* 현재 담당 행사 */}
          <div className="border-b border-white/10 px-4 py-3">
            {currentExhibition ? (
              <>
                <div className="truncate text-sm font-bold text-white">{currentExhibition.title}</div>
                {hasMultipleExhibitions && (
                  <button
                    type="button"
                    onClick={handleChangeExhibition}
                    className="mt-1 text-xs text-white/55 transition-colors hover:text-white"
                  >
                    행사 변경 →
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={handleChangeExhibition}
                className="text-xs font-semibold text-primary transition-colors hover:text-accent"
              >
                행사를 선택해주세요 →
              </button>
            )}
          </div>

          {/* 네비 항목 */}
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

          {/* 유저 정보 + 로그아웃 */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary text-xs font-bold text-white">
                {user?.name?.slice(0, 1) ?? '?'}
              </span>
              <div className="min-w-0 leading-tight">
                <div className="truncate text-sm font-semibold text-white">{user?.name}</div>
                <div className="text-[11px] text-white/55">STAFF</div>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="mt-2 w-full px-2 py-1 text-xs font-semibold text-white/55 transition-colors hover:bg-white/10 hover:text-white"
            >
              로그아웃
            </button>
          </div>
        </aside>

        {/* ─── 콘텐츠 컬럼 ─── */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* 모바일 전용 헤더 */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-shell px-4 md:hidden">
            <span className="text-base font-extrabold tracking-tight text-white">FairPilot</span>
            <div className="flex items-center gap-2">
              <span className="bg-primary px-2 py-0.5 text-[10px] font-bold text-white">STAFF</span>
              <span className="text-sm font-semibold text-white/80">{user?.name}</span>
              <button
                type="button"
                onClick={logout}
                className="ml-1 px-2 py-1 text-sm font-semibold text-white/55 transition-colors hover:text-white"
              >
                로그아웃
              </button>
            </div>
          </header>

          {/* 메인 콘텐츠
              모바일: 하단 탭바 + safe-area 높이만큼 패딩 확보.
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
