import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Field, fieldControlClass } from '../../../components/Field'
import { QueryState } from '../../../components/QueryState'
import { useBoothsByExhibition } from '../../../features/booth/hooks'
import { useExhibition } from '../../../features/exhibition/hooks'
import { useCreateRecommendedRoute, useMyRecommendedRoutes } from '../../../features/route/hooks'
import type { RecommendedRouteSummary } from '../../../lib/api/recommendedRoutes'
import { formatDateTime } from '../../../lib/format'
import type { Booth, RouteStatus } from '../../../types'

const MIN_MINUTES = 30
const MAX_MINUTES = 240
const MUST_VISIT_OPTION_COUNT = 8
const START_GATE_OPTIONS = ['A', 'B', 'C']

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

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function Spinner() {
  return <span className="h-4 w-4 shrink-0 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />
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

function RouteCreatePanel({
  exhibitionId,
  exhibitionTitle,
  mustVisitOptions,
  onCreated,
  onClose,
}: {
  exhibitionId: number | null
  exhibitionTitle?: string
  mustVisitOptions: Booth[]
  onCreated: (routeId: number) => void
  onClose: () => void
}) {
  const [interestText, setInterestText] = useState('')
  const [availableMinutes, setAvailableMinutes] = useState(90)
  const [mustVisitIds, setMustVisitIds] = useState<number[]>([])
  const [startGate, setStartGate] = useState(START_GATE_OPTIONS[0])

  const createRoute = useCreateRecommendedRoute()

  function toggleMustVisit(id: number) {
    setMustVisitIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  function handleSubmit() {
    if (exhibitionId === null || !interestText.trim() || createRoute.isPending) return

    createRoute.mutate(
      { exhibitionId, interestText: interestText.trim(), availableMinutes, mustVisitBoothIds: mustVisitIds, startGate },
      {
        onSuccess: (result) => {
          setInterestText('')
          setMustVisitIds([])
          onCreated(result.routeId)
        },
      },
    )
  }

  return (
    <div className="border border-line bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <div className="text-base font-bold text-ink">새 동선 만들기</div>
          {exhibitionTitle && <p className="mt-0.5 text-xs text-muted">{exhibitionTitle} 기준으로 추천합니다.</p>}
        </div>
        <button type="button" onClick={onClose} className="shrink-0 text-xs font-semibold text-muted hover:text-ink lg:hidden">
          목록으로
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <Field label="관심사" id="route-interest" required hint="쉼표로 구분해 자유롭게 입력하세요.">
          <textarea
            id="route-interest"
            rows={2}
            value={interestText}
            onChange={(event) => setInterestText(event.target.value)}
            placeholder="예: AI SaaS, 제조 자동화, 스타트업 투자"
            className={`${fieldControlClass} resize-none`}
          />
        </Field>

        <div>
          <div className="mb-2.5 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-muted">가용 시간</span>
            <span>
              <b className="text-lg font-extrabold text-primary">{availableMinutes}</b>
              <span className="ml-0.5 text-xs text-muted">분</span>
            </span>
          </div>
          <input
            type="range"
            min={MIN_MINUTES}
            max={MAX_MINUTES}
            step={15}
            value={availableMinutes}
            onChange={(event) => setAvailableMinutes(Number(event.target.value))}
            className="w-full accent-primary"
          />
          <div className="mt-1.5 flex justify-between text-[10.5px] text-muted">
            <span>30분</span>
            <span>4시간</span>
          </div>
        </div>

        <Field label="출발 게이트" id="route-start-gate">
          <select
            id="route-start-gate"
            value={startGate}
            onChange={(event) => setStartGate(event.target.value)}
            className={fieldControlClass}
          >
            {START_GATE_OPTIONS.map((gate) => (
              <option key={gate} value={gate}>
                {gate}게이트
              </option>
            ))}
          </select>
        </Field>

        {mustVisitOptions.length > 0 && (
          <div>
            <div className="mb-2.5 text-sm font-semibold text-muted">꼭 갈 부스 (선택)</div>
            <div className="flex max-h-52 flex-col gap-2 overflow-y-auto pr-1">
              {mustVisitOptions.map((booth) => {
                const isOn = mustVisitIds.includes(booth.id)
                return (
                  <button
                    key={booth.id}
                    type="button"
                    onClick={() => toggleMustVisit(booth.id)}
                    className={`flex items-center gap-2.5 border p-2.5 text-left transition-colors ${
                      isOn ? 'border-primary bg-surface' : 'border-line bg-white hover:border-primary/50'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center border ${
                        isOn ? 'border-primary bg-primary text-white' : 'border-line bg-white text-transparent'
                      }`}
                    >
                      <CheckIcon />
                    </span>
                    <span className="flex-1 text-sm font-semibold text-ink">{booth.name}</span>
                    <span className="text-xs text-muted">{booth.floor}F</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {createRoute.isError && <p className="text-xs font-medium text-danger">동선을 만들지 못했습니다. 잠시 후 다시 시도해주세요.</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!interestText.trim() || exhibitionId === null || createRoute.isPending}
          className="flex h-11 w-full items-center justify-center gap-2 bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createRoute.isPending && <Spinner />}
          {createRoute.isPending ? '동선 계산 중...' : '동선 만들기'}
        </button>
      </div>
    </div>
  )
}

export default function MyRouteListPage() {
  const navigate = useNavigate()
  const [mobileView, setMobileView] = useState<'list' | 'form'>('list')

  // 방문자의 "현재 행사"는 admin의 currentExhibitionStore(담당 행사 선택)와 무관하다 — 지금은
  // 고정 1번 행사를 본다. 추후 URL 파라미터/예약 컨텍스트 기반으로 교체될 자리다.
  const exhibition = useExhibition(1)
  const exhibitionId = exhibition.data?.id ?? null
  const booths = useBoothsByExhibition(exhibitionId)
  const mustVisitOptions = useMemo(() => (booths.data ?? []).slice(0, MUST_VISIT_OPTION_COUNT), [booths.data])

  const routes = useMyRecommendedRoutes()
  const data = routes.data ?? []

  function handleCreated(routeId: number) {
    setMobileView('list')
    navigate(`/my/route/${routeId}`)
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-5 pb-28 lg:flex lg:items-start lg:gap-8 lg:p-8 lg:pb-8">
      <div className={`${mobileView === 'form' ? 'block' : 'hidden'} mb-6 lg:mb-0 lg:block lg:w-80 lg:shrink-0`}>
        <RouteCreatePanel
          exhibitionId={exhibitionId}
          exhibitionTitle={exhibition.data?.title}
          mustVisitOptions={mustVisitOptions}
          onCreated={handleCreated}
          onClose={() => setMobileView('list')}
        />
      </div>

      <div className={`${mobileView === 'list' ? 'block' : 'hidden'} min-w-0 flex-1 lg:block`}>
        <div className="mb-6">
          <h1 className="text-xl font-extrabold tracking-tight text-ink">내 AI 동선</h1>
          <p className="mt-1 text-sm text-muted">최근 추천받은 동선을 확인하고 새 동선을 만들어보세요.</p>
        </div>

        <QueryState
          isLoading={routes.isLoading}
          isError={routes.isError}
          isEmpty={data.length === 0}
          emptyMessage="아직 추천받은 동선이 없습니다. 동선을 만들어보세요."
        >
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
            {data.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        </QueryState>
      </div>

      {mobileView === 'list' && (
        <button
          type="button"
          onClick={() => setMobileView('form')}
          className="fixed inset-x-0 bottom-16 z-20 flex h-14 items-center justify-center bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-hover lg:hidden"
        >
          동선 만들기
        </button>
      )}
    </div>
  )
}
