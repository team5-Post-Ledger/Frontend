import type { MouseEvent as ReactMouseEvent } from 'react'
import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { FloorMap, type FloorMapBooth } from '../../components/FloorMap'
import { computeFloorPlacements } from '../../components/floorMapPlacement'
import { QueryState } from '../../components/QueryState'
import { getBoothFootprint } from '../../features/booth/floorLayout'
import { useBoothsByExhibition } from '../../features/booth/hooks'
import type { CongestionPointLevel } from '../../features/congestion/api'
import { useCongestionLive } from '../../features/congestion/hooks'
import { useExhibition } from '../../features/exhibition/hooks'
import { RouteCreatePanel } from '../../features/route/RouteCreatePanel'
import { RouteFloorMapSection } from '../../features/route/RouteFloorMapSection'
import { useMyRecommendedRoutes, useRecommendedRoute } from '../../features/route/hooks'
import { formatDateTime } from '../../lib/format'
import type { Booth } from '../../types'

const ZOOM_STEPS = [1, 1.5, 2]

const LEVEL_LABEL: Record<CongestionPointLevel, string> = {
  LOW: '여유',
  MEDIUM: '보통',
  HIGH: '혼잡',
  FULL: '포화',
}

// 부스 클릭 패널의 짧은 안내 문장(task-map-fix2/feature.md §9-3) — 예상대기/평균체류 같은 수치는
// mock에 없는 값을 지어내는 것("가짜 정밀도")이라 넣지 않고, 이미 아는 레벨 정보만으로 만든 문장이다.
const LEVEL_DESCRIPTION: Record<CongestionPointLevel, string> = {
  LOW: '지금 바로 둘러보기 좋은 부스예요.',
  MEDIUM: '약간 붐비지만 무난하게 둘러볼 수 있어요.',
  HIGH: '지금은 혼잡해요. 잠시 후 방문을 추천해요.',
  FULL: '지금은 포화 상태예요. 다른 부스를 먼저 둘러보는 걸 추천해요.',
}
const NO_DATA_DESCRIPTION = '아직 혼잡도 정보가 없어요.'

// 연한 톤 팔레트(spec.md §3.3) — 뱃지류의 solid 채움과 다르게, 도면 전체에 진한 경고색이
// 흩어지는 걸 피하기 위해 의도적으로 연하게 간다.
const LEVEL_BOX_CLASS: Record<CongestionPointLevel, string> = {
  LOW: 'bg-success/20 text-success',
  MEDIUM: 'bg-warning/20 text-warning',
  HIGH: 'bg-danger/20 text-danger',
  FULL: 'bg-danger/20 text-danger',
}

// 인원수 필 배지(task-map-fix2/feature.md §1) — 박스 배경(연한 톤)과 대비되도록 solid 채움을 쓴다.
const LEVEL_PILL_CLASS: Record<CongestionPointLevel, string> = {
  LOW: 'bg-success text-white',
  MEDIUM: 'bg-warning text-white',
  HIGH: 'bg-danger text-white',
  FULL: 'bg-danger text-white',
}

const NO_DATA_BOX_CLASS = 'bg-line text-muted'

// 혼잡도 번짐 오버레이(task-map-fix/spec.md §2.2) — 박스 배경과 별개의 표. 데이터 없는 부스는
// 오버레이 자체를 그리지 않는다.
const LEVEL_HEAT_COLOR: Record<CongestionPointLevel, string> = {
  LOW: 'var(--color-success)',
  MEDIUM: 'var(--color-warning)',
  HIGH: 'var(--color-danger)',
  FULL: 'var(--color-danger)',
}
// 번짐 원의 지름(캔버스 가로폭 대비 %) — 고정 px 블러를 걷어내면서 블러가 바깥으로 퍼뜨려주던
// 몫을 원 크기로 흡수(기존 16/22/28/32에서 상향). 눈으로 보고 튜닝하는 값.
const LEVEL_HEAT_SIZE_PCT: Record<CongestionPointLevel, number> = {
  LOW: 22,
  MEDIUM: 30,
  HIGH: 38,
  FULL: 44,
}

// 가우시안 블러의 부드러운 감쇠를 그라디언트 스톱만으로 근사한다. filter: blur()는 반경이 px
// 고정이라 작은(모바일) 캔버스에서 원을 통째로 흩어버려 오버레이가 사라졌다 — 모든 치수를 %로
// 통일해 화면 크기·줌 배율과 무관하게 같은 비율로 번지게 한다.
function heatGradient(color: string) {
  return `radial-gradient(circle closest-side, ${color} 0%, color-mix(in srgb, ${color} 65%, transparent) 35%, color-mix(in srgb, ${color} 30%, transparent) 60%, color-mix(in srgb, ${color} 10%, transparent) 80%, transparent 100%)`
}
const LEVEL_HEAT_OPACITY: Record<CongestionPointLevel, number> = {
  LOW: 0.26,
  MEDIUM: 0.32,
  HIGH: 0.38,
  FULL: 0.4,
}

const DRAG_THRESHOLD_PX = 5

type CongestionPointInfo = { count: number; level: CongestionPointLevel }

function FloorArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {direction === 'left' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
    </svg>
  )
}

// AI 동선을 앱 전역에서 항상 표시하는 아이콘(VisitorLayout/AssistantPage와 동일 markup)과
// 브랜드 일관성을 맞춘다(task-map-fix2/feature.md §4).
function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
    </svg>
  )
}

// 프로젝트 전역에서 이미 쓰는 닫기 아이콘 패턴(예: src/pages/admin/BoothsPage.tsx)과 동일하게 맞춘다.
function CloseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// 부스 중심 좌표에 혼잡도 레벨별 블러 원을 얹는다(task-map-fix/feature.md §1.1). FloorMap이 이미
// 계산해둔 배치(computeFloorPlacements)를 그대로 재사용해 부스 박스와 정확히 같은 좌표계를 쓴다.
function CongestionHeatOverlay({
  booths,
  congestionByBoothId,
}: {
  booths: FloorMapBooth[]
  congestionByBoothId: Map<number, CongestionPointInfo>
}) {
  const placements = useMemo(() => computeFloorPlacements(booths), [booths])

  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      {booths.map((booth) => {
        const point = congestionByBoothId.get(booth.boothId)
        const placement = placements.get(booth.boothId)
        if (!point || !placement) return null

        const centerXPct = placement.leftPct + placement.widthPct / 2
        const centerYPct = placement.topPct + placement.heightPct / 2
        const size = LEVEL_HEAT_SIZE_PCT[point.level]

        return (
          <div
            key={booth.boothId}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${centerXPct}%`,
              top: `${centerYPct}%`,
              // 캔버스가 4:3이라 width/height를 각각 %로 주면 타원이 된다 — 가로폭 기준 정원으로 고정.
              width: `${size}%`,
              aspectRatio: '1 / 1',
              background: heatGradient(LEVEL_HEAT_COLOR[point.level]),
              opacity: LEVEL_HEAT_OPACITY[point.level],
            }}
          />
        )
      })}
    </div>
  )
}

// 사용자 위치 마커(task-map-fix2/feature.md §2) — 또렷한 점 + 그 바깥으로만 은은하게 퍼지는 halo +
// "내 위치" 라벨. 부스와 동일한 좌표계(줌/팬 적용되는 캔버스 내부) 안의 오브젝트라 팬/줌 시 같이
// 움직인다 — 기존 "입구" 사각 장식을 대체한다.
// 이번 스코프는 항상 입구 위치에 고정된다: 박람회가 시작되고 방문자가 실제로 특정 부스에 체크인한
// 기록을 프론트/mock 어디에서도 조회할 수 없어(task-map-fix/spec.md §8-1), "entry한 부스로 이동"은
// 갭으로 남겨뒀다. 갭이 풀리면 이 컴포넌트에 분기를 추가할 자리로 남겨둔다.
function UserLocationMarker() {
  return (
    <div
      className="pointer-events-none absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
      style={{ left: '3%', top: '50%' }}
    >
      <span className="whitespace-nowrap border border-primary bg-white px-2 py-1 text-[10px] font-bold text-primary shadow-sm">
        내 위치
      </span>
      <span className="relative flex h-3 w-3 items-center justify-center">
        <span className="absolute h-6 w-6 rounded-full bg-primary/25 blur-md" aria-hidden="true" />
        <span className="relative h-3 w-3 rounded-full bg-primary" />
      </span>
    </div>
  )
}

// 혼잡도 레벨 범례(task-map-fix2/feature.md §5) — 상태 표시 점 크기(h-1.5 w-1.5)는 프로젝트가
// 이미 쓰는 규칙을 그대로 따른다.
function CongestionLegend() {
  const items: { label: string; className: string }[] = [
    { label: '여유', className: 'bg-success' },
    { label: '보통', className: 'bg-warning' },
    { label: '혼잡·포화', className: 'bg-danger' },
  ]
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${item.className}`} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

function BoothDetailOverlay({
  booth,
  point,
  onClose,
}: {
  booth: Booth
  point: CongestionPointInfo | undefined
  onClose: () => void
}) {
  const label = point ? LEVEL_LABEL[point.level] : '데이터 없음'
  const chipClass = point ? LEVEL_BOX_CLASS[point.level] : NO_DATA_BOX_CLASS
  const description = point ? LEVEL_DESCRIPTION[point.level] : NO_DATA_DESCRIPTION
  return (
    <div className="absolute bottom-3 right-3 z-30 w-60 border border-line bg-white/95 shadow-sm backdrop-blur-sm">
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <span className={`px-1.5 py-0.5 text-[10px] font-bold ${chipClass}`}>{label}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-7 w-7 shrink-0 items-center justify-center border border-line text-muted transition-colors hover:border-primary hover:text-primary"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="mt-2 text-sm font-bold text-ink">{booth.name}</div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">{description}</p>
      </div>
      {point && (
        <div className="border-t border-line px-3 py-2.5">
          <div className="text-lg font-extrabold leading-none text-ink">
            {point.count}
            <span className="ml-0.5 text-xs font-medium text-muted">명</span>
          </div>
          <div className="mt-1 text-[10px] font-semibold text-muted">현재 인원</div>
        </div>
      )}
    </div>
  )
}

// 혼잡도 허브의 "AI 동선" 탭(task-map-fix2/feature.md §7) — 이 박람회의 가장 최근 동선을 지도로
// 직접 그리고(RouteFloorMapSection 공유), 그 외 과거 동선은 목록으로, 새 동선 생성 폼은 항상 같이
// 보여준다. 동선이 하나도 없으면 지도 없이 생성 폼만 남는다.
function RouteTabSection({
  exhibitionId,
  exhibitionTitle,
  booths,
}: {
  exhibitionId: number
  exhibitionTitle?: string
  booths: Booth[]
}) {
  const navigate = useNavigate()
  const routes = useMyRecommendedRoutes(exhibitionId)
  const latestRouteId = routes.data?.[0]?.id ?? null
  const latestRoute = useRecommendedRoute(latestRouteId)
  const otherRoutes = routes.data?.slice(1) ?? []
  const mustVisitOptions = useMemo(() => booths.slice(0, 8), [booths])

  return (
    <QueryState isLoading={routes.isLoading} isError={routes.isError} height={200}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <div className="flex flex-1 flex-col gap-4">
          {latestRouteId !== null && (
            <QueryState isLoading={latestRoute.isLoading} isError={latestRoute.isError} height={200}>
              {latestRoute.data && <RouteFloorMapSection stops={latestRoute.data.stops} booths={booths} />}
            </QueryState>
          )}

          {otherRoutes.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="text-sm font-bold text-ink">이전 동선</div>
              {otherRoutes.map((route) => (
                <Link
                  key={route.id}
                  to={`/my/route/${route.id}`}
                  className="flex items-center justify-between border border-line bg-white p-3 transition-colors hover:border-primary"
                >
                  <div>
                    <div className="text-sm font-bold text-ink">{formatDateTime(route.createdAt)} 생성</div>
                    <div className="mt-0.5 text-xs text-muted">
                      {route.stopCount}곳 · 예상 {route.totalEstMinutes}분
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-muted">상세 →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="lg:w-96 lg:shrink-0">
          <RouteCreatePanel
            exhibitionId={exhibitionId}
            exhibitionTitle={exhibitionTitle}
            mustVisitOptions={mustVisitOptions}
            onCreated={(routeId) => navigate(`/my/route/${routeId}`)}
          />
        </div>
      </div>
    </QueryState>
  )
}

export default function ExhibitionCongestionPage() {
  const { id } = useParams<{ id: string }>()
  const exhibitionId = id ? Number(id) : null
  const [searchParams] = useSearchParams()

  const [activeTab, setActiveTab] = useState<'congestion' | 'route'>(() =>
    searchParams.get('tab') === 'route' ? 'route' : 'congestion',
  )

  const exhibition = useExhibition(exhibitionId)
  const booths = useBoothsByExhibition(exhibitionId)
  const congestion = useCongestionLive(exhibitionId ?? undefined)

  const floors = useMemo(() => {
    const data = booths.data ?? []
    return Array.from(new Set(data.map((booth) => booth.floor))).sort((a, b) => a - b)
  }, [booths.data])

  // null = "사용자가 아직 화살표를 안 눌렀다" → 기본값(최저 층)을 파생값으로 쓴다.
  // useEffect로 "데이터 로드되면 1층으로 세팅" 하는 대신 이렇게 하면 set-state-in-effect 없이 간다.
  const [floorOverride, setFloorOverride] = useState<number | null>(null)
  const selectedFloor = floorOverride ?? floors[0] ?? null
  const floorIndex = selectedFloor !== null ? floors.indexOf(selectedFloor) : -1

  function goToPrevFloor() {
    if (floorIndex > 0) setFloorOverride(floors[floorIndex - 1])
  }
  function goToNextFloor() {
    if (floorIndex >= 0 && floorIndex < floors.length - 1) setFloorOverride(floors[floorIndex + 1])
  }

  const floorBooths = useMemo(
    () => (booths.data ?? []).filter((booth) => booth.floor === selectedFloor),
    [booths.data, selectedFloor],
  )

  const congestionByBoothId = useMemo(() => {
    const map = new Map<number, CongestionPointInfo>()
    for (const point of congestion.data?.points ?? []) {
      // 혼잡도는 BOOTH 타입만 다룬다 — SESSION/GATE가 섞여 있어도 방어적으로 무시(feature.md §2.3).
      if (point.type === 'BOOTH') map.set(point.pointId, { count: point.count, level: point.level })
    }
    return map
  }, [congestion.data])

  const floorMapBooths: FloorMapBooth[] = useMemo(
    () =>
      floorBooths.flatMap((booth) => {
        const footprint = getBoothFootprint(booth.id)
        if (!footprint) return []
        return [{ boothId: booth.id, name: booth.name, ...footprint }]
      }),
    [floorBooths],
  )

  const [zoomIndex, setZoomIndex] = useState(0)
  const zoomFactor = ZOOM_STEPS[zoomIndex]

  const [selectedBoothId, setSelectedBoothId] = useState<number | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const dragStateRef = useRef({ startX: 0, startY: 0, moved: false })

  function handleMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    const container = containerRef.current
    if (!container) return

    dragStateRef.current = { startX: event.clientX, startY: event.clientY, moved: false }
    const startScrollLeft = container.scrollLeft
    const startScrollTop = container.scrollTop

    function handleMouseMove(moveEvent: MouseEvent) {
      const dx = moveEvent.clientX - dragStateRef.current.startX
      const dy = moveEvent.clientY - dragStateRef.current.startY
      if (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX) {
        dragStateRef.current.moved = true
      }
      if (container) {
        container.scrollLeft = startScrollLeft - dx
        container.scrollTop = startScrollTop - dy
      }
    }
    function handleMouseUp() {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    // document에 등록 — 드래그 도중 커서가 컨테이너 밖으로 나가도 이동이 안 끊기게(spec.md §2.3).
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  function handleBoxClick(boothId: number) {
    // 드래그 후 손을 뗀 걸 클릭으로 오인해 패널을 열지 않도록 구분한다(spec.md §2.3 그대로 재사용).
    if (dragStateRef.current.moved) {
      dragStateRef.current.moved = false
      return
    }
    // 부스 상세로 이동하지 않는다(확정, task-map-fix/feature.md §1.2) — 우측 하단 오버레이만 띄운다.
    // 이미 선택된 부스를 다시 클릭하면 선택을 해제한다(토글) — 테두리·툴팁이 같이 사라진다.
    setSelectedBoothId((prev) => (prev === boothId ? null : boothId))
  }

  function renderBox(booth: FloorMapBooth) {
    const point = congestionByBoothId.get(booth.boothId)
    return (
      <span className="flex w-full flex-col items-center gap-1 px-1 text-center leading-tight">
        <span className="line-clamp-1 w-full text-xs font-bold text-ink">{booth.name}</span>
        {point && (
          <span className={`px-1.5 py-0.5 text-[10px] font-bold ${LEVEL_PILL_CLASS[point.level]}`}>{point.count}명</span>
        )}
      </span>
    )
  }

  function boxClassName(booth: FloorMapBooth) {
    const point = congestionByBoothId.get(booth.boothId)
    const baseClass = point ? LEVEL_BOX_CLASS[point.level] : NO_DATA_BOX_CLASS
    // 선택된 부스는 브랜드 컬러(primary) 아웃라인으로 강조한다(task-map-fix2 2차 피드백).
    const selectedClass = booth.boothId === selectedBoothId ? 'outline outline-2 outline-primary outline-offset-2' : ''
    return `${baseClass} ${selectedClass}`
  }

  if (exhibitionId === null) {
    return <p className="p-6 text-sm text-danger">잘못된 박람회 경로입니다.</p>
  }

  const selectedBooth = selectedBoothId !== null ? floorBooths.find((booth) => booth.id === selectedBoothId) : undefined

  return (
    <div className="p-5 lg:p-8">
      <Link
        to={`/exhibitions/${exhibitionId}`}
        className="mb-4 inline-block text-xs font-semibold text-muted transition-colors hover:text-primary"
      >
        ← 박람회 상세
      </Link>

      <QueryState
        isLoading={exhibition.isLoading || booths.isLoading}
        isError={exhibition.isError || booths.isError}
        isEmpty={!exhibition.isLoading && !exhibition.isError && (!exhibition.data || (booths.data?.length ?? 0) === 0)}
        emptyMessage="등록된 부스가 없어 혼잡도 지도를 표시할 수 없습니다."
        height={320}
      >
        <h1 className="mb-1 text-xl font-extrabold tracking-tight text-ink lg:text-2xl">{exhibition.data?.title}</h1>
        <p className="mb-5 text-sm text-muted">부스별 실시간 혼잡도를 확인하고, 이 박람회의 AI 동선도 여기서 만들어보세요.</p>

        <div className="mb-5 inline-flex border border-line">
          <button
            type="button"
            onClick={() => setActiveTab('congestion')}
            className={`px-3.5 py-1.5 text-xs font-bold transition-colors ${
              activeTab === 'congestion' ? 'bg-primary text-white' : 'text-muted hover:text-ink'
            }`}
          >
            혼잡도 지도
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('route')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold transition-colors ${
              activeTab === 'route' ? 'bg-primary text-white' : 'text-muted hover:text-ink'
            }`}
          >
            <SparkleIcon />
            AI 동선
          </button>
        </div>

        {activeTab === 'route' ? (
          <RouteTabSection exhibitionId={exhibitionId} exhibitionTitle={exhibition.data?.title} booths={booths.data ?? []} />
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setZoomIndex((prev) => Math.max(0, prev - 1))}
                  disabled={zoomIndex === 0}
                  aria-label="축소"
                  className="flex h-8 w-8 items-center justify-center border border-line text-ink transition-colors hover:border-primary disabled:opacity-40"
                >
                  −
                </button>
                <span className="w-12 text-center text-xs text-muted">{Math.round(zoomFactor * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoomIndex((prev) => Math.min(ZOOM_STEPS.length - 1, prev + 1))}
                  disabled={zoomIndex === ZOOM_STEPS.length - 1}
                  aria-label="확대"
                  className="flex h-8 w-8 items-center justify-center border border-line text-ink transition-colors hover:border-primary disabled:opacity-40"
                >
                  +
                </button>
              </div>

              {floors.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={goToPrevFloor}
                    disabled={floorIndex <= 0}
                    aria-label="이전 층"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-40 disabled:hover:bg-primary/10 disabled:hover:text-primary"
                  >
                    <FloorArrowIcon direction="left" />
                  </button>
                  <span className="text-sm font-bold text-ink">{selectedFloor}층 안내도</span>
                  <button
                    type="button"
                    onClick={goToNextFloor}
                    disabled={floorIndex < 0 || floorIndex >= floors.length - 1}
                    aria-label="다음 층"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-40 disabled:hover:bg-primary/10 disabled:hover:text-primary"
                  >
                    <FloorArrowIcon direction="right" />
                  </button>
                </div>
              )}
            </div>

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <CongestionLegend />
              <span className="flex shrink-0 items-center gap-1.5 bg-surface px-2.5 py-1 text-[11px] font-bold text-ink">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-live" />
                LIVE
              </span>
            </div>

            {/* 우측 하단 오버레이 패널의 고정 기준점 — 안쪽 스크롤/줌 콘텐츠 바깥에 둬서 팬 중에도
                화면 모서리에 그대로 떠 있게 한다(부스 클릭 오버레이는 지도 "뷰포트" 기준, task-map-fix). */}
            <div className="relative">
              <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                className="-mx-5 w-[calc(100%+2.5rem)] overflow-auto border-y border-line lg:mx-0 lg:w-full lg:border-x"
                style={{ aspectRatio: '4 / 3' }}
              >
                <div
                  className="relative cursor-grab bg-surface active:cursor-grabbing"
                  style={{ width: `${zoomFactor * 100}%`, height: `${zoomFactor * 100}%` }}
                >
                  <QueryState isLoading={congestion.isLoading} isError={congestion.isError}>
                    <>
                      <CongestionHeatOverlay booths={floorMapBooths} congestionByBoothId={congestionByBoothId} />
                      <UserLocationMarker />
                      <FloorMap
                        booths={floorMapBooths}
                        renderBox={renderBox}
                        boxClassName={boxClassName}
                        onBoxClick={handleBoxClick}
                      />
                    </>
                  </QueryState>
                </div>
              </div>

              {selectedBooth && (
                <BoothDetailOverlay
                  booth={selectedBooth}
                  point={congestionByBoothId.get(selectedBooth.id)}
                  onClose={() => setSelectedBoothId(null)}
                />
              )}
            </div>
          </>
        )}
      </QueryState>
    </div>
  )
}
