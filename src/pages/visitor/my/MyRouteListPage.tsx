import { Link } from 'react-router'
import { QueryState } from '../../../components/QueryState'
import { useMyRecommendedRoutes } from '../../../features/route/hooks'
import type { RecommendedRouteSummary } from '../../../lib/api/recommendedRoutes'
import { formatDateTime } from '../../../lib/format'
import type { RouteStatus } from '../../../types'

const ROUTE_STATUS_BADGE: Record<RouteStatus, { label: string; className: string }> = {
  CREATED: { label: '생성됨', className: 'bg-live text-ink' },
  EXPIRED: { label: '만료됨', className: 'bg-surface text-muted' },
  DELETED: { label: '삭제됨', className: 'bg-surface text-muted' },
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function RouteIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h8a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4h-2" />
    </svg>
  )
}

function RouteStatusBadge({ status }: { status: RouteStatus }) {
  const badge = ROUTE_STATUS_BADGE[status]
  return <span className={`shrink-0 px-2.5 py-1 text-[11px] font-bold ${badge.className}`}>{badge.label}</span>
}

function RouteCard({ route }: { route: RecommendedRouteSummary }) {
  return (
    <Link to={`/my/route/${route.id}`} className="block border border-line bg-white transition-colors hover:border-primary">
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="text-[15px] font-bold leading-snug text-ink">{route.exhibitionTitle}</div>
          <RouteStatusBadge status={route.routeStatus} />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs text-muted">
            <CalendarIcon />
            {formatDateTime(route.createdAt)}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <RouteIcon />
            {route.stopCount}곳 · 예상 {route.totalEstMinutes}분
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end border-t border-line bg-surface px-4 py-2.5">
        <span className="text-xs font-semibold text-muted">상세 →</span>
      </div>
    </Link>
  )
}

// 동선 "만들기"는 각 박람회의 혼잡도 지도 안 "AI 동선" 탭에서만 한다(task-map-fix/feature.md §3) —
// 이 페이지는 exhibitionId 맥락이 없는 전역 진입점이라 만들기를 여기 두면 박람회를 하드코딩해야
// 했던 문제가 재발한다. 이 페이지는 박람회 무관 히스토리 목록 전용으로만 남긴다.
export default function MyRouteListPage() {
  const routes = useMyRecommendedRoutes()
  const data = routes.data ?? []

  return (
    <div className="mx-auto w-full max-w-5xl p-5 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold tracking-tight text-ink">내 AI 동선</h1>
        <p className="mt-1 text-sm text-muted">지금까지 추천받은 동선을 확인하세요. 새 동선은 각 박람회의 혼잡도 지도에서 만들 수 있어요.</p>
      </div>

      <QueryState
        isLoading={routes.isLoading}
        isError={routes.isError}
        isEmpty={data.length === 0}
        emptyMessage="아직 추천받은 동선이 없어요. 박람회 상세의 혼잡도 지도에서 동선을 만들어보세요."
      >
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
          {data.map((route) => (
            <RouteCard key={route.id} route={route} />
          ))}
        </div>
      </QueryState>
    </div>
  )
}
