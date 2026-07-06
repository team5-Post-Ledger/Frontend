import { Link, Outlet } from 'react-router'
import { ConsoleTopBar } from '../../components/ConsoleTopBar'
import { useCurrentExhibition } from '../../features/exhibition/hooks'
import { formatDateRange } from '../../lib/format'
import { useAuthStore } from '../../stores/authStore'
import { useCurrentExhibitionStore } from '../../stores/currentExhibitionStore'
import type { ExhibitionStatus } from '../../types'
import { ADMIN_OVERFLOW_GROUPS, getAdminPrimaryNav } from './adminNav'

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

// 상단바 가운데에 들어가는 "현재 담당 행사" 문맥. 예전 사이드바 헤더가 하던
// 행사 미선택/로딩/에러/선택됨 게이팅을 그대로 이식한다.
function AdminExhibitionContext() {
  const exhibitionId = useCurrentExhibitionStore((state) => state.exhibitionId)
  const exhibition = useCurrentExhibition()

  if (exhibitionId === null) {
    return (
      <Link to="/admin" className="text-sm font-semibold text-primary hover:text-primary-hover">
        행사를 선택해주세요 →
      </Link>
    )
  }

  if (exhibition.isLoading) {
    return <span className="text-sm text-muted">불러오는 중...</span>
  }

  if (exhibition.isError || !exhibition.data) {
    return <span className="text-sm text-muted">행사 정보를 불러오지 못했습니다.</span>
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="min-w-0">
        <div className="truncate text-base font-extrabold text-ink">{exhibition.data.title}</div>
        <div className="mt-0.5 text-xs font-medium text-muted">
          {formatDateRange(exhibition.data.startDate, exhibition.data.endDate)}
        </div>
      </div>

      <span
        className={['shrink-0 px-2.5 py-1 text-xs font-bold', STATUS_BADGE_CLASS[exhibition.data.status]].join(' ')}
      >
        {STATUS_LABEL[exhibition.data.status]}
      </span>

      <Link
        to="/admin"
        className="shrink-0 text-xs font-semibold text-muted transition-colors hover:text-primary"
      >
        행사 변경
      </Link>
    </div>
  )
}

export function AdminLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const exhibitionId = useCurrentExhibitionStore((state) => state.exhibitionId)

  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <ConsoleTopBar
        homeTo="/admin"
        consoleName="Admin Console"
        primaryNav={getAdminPrimaryNav(exhibitionId)}
        overflowGroups={ADMIN_OVERFLOW_GROUPS}
        contextSlot={<AdminExhibitionContext />}
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
