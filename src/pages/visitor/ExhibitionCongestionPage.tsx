import type { MouseEvent as ReactMouseEvent } from 'react'
import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { FloorMap, type FloorMapBooth } from '../../components/FloorMap'
import { QueryState } from '../../components/QueryState'
import { getBoothFootprint } from '../../features/booth/floorLayout'
import { useBoothsByExhibition } from '../../features/booth/hooks'
import type { CongestionPointLevel } from '../../features/congestion/api'
import { useCongestionLive } from '../../features/congestion/hooks'
import { useExhibition } from '../../features/exhibition/hooks'

const ZOOM_STEPS = [1, 1.5, 2]

const LEVEL_LABEL: Record<CongestionPointLevel, string> = {
  LOW: '여유',
  MEDIUM: '보통',
  HIGH: '혼잡',
  FULL: '포화',
}

// 연한 톤 팔레트(spec.md §3.3) — 뱃지류의 solid 채움과 다르게, 도면 전체에 진한 경고색이
// 흩어지는 걸 피하기 위해 의도적으로 연하게 간다.
const LEVEL_BOX_CLASS: Record<CongestionPointLevel, string> = {
  LOW: 'bg-success/20 text-success',
  MEDIUM: 'bg-warning/20 text-warning',
  HIGH: 'bg-danger/20 text-danger',
  FULL: 'bg-danger/20 text-danger',
}

const NO_DATA_BOX_CLASS = 'bg-line text-muted'

const DRAG_THRESHOLD_PX = 5

function FloorArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {direction === 'left' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
    </svg>
  )
}

export default function ExhibitionCongestionPage() {
  const { id } = useParams<{ id: string }>()
  const exhibitionId = id ? Number(id) : null
  const navigate = useNavigate()

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
    const map = new Map<number, { count: number; level: CongestionPointLevel }>()
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
    // 드래그 후 손을 뗀 걸 클릭으로 오인해 이동하지 않도록 구분한다(spec.md §2.3).
    if (dragStateRef.current.moved) {
      dragStateRef.current.moved = false
      return
    }
    navigate(`/exhibitions/${exhibitionId}/booths/${boothId}`)
  }

  function renderBox(booth: FloorMapBooth) {
    const point = congestionByBoothId.get(booth.boothId)
    const label = point ? LEVEL_LABEL[point.level] : '데이터 없음'
    return (
      <span className="flex w-full flex-col items-center gap-0.5 px-1 text-center leading-tight">
        <span className="line-clamp-1 w-full text-[11px] font-bold">{booth.name}</span>
        <span className="text-[10px]">{label}</span>
      </span>
    )
  }

  function boxClassName(booth: FloorMapBooth) {
    const point = congestionByBoothId.get(booth.boothId)
    return point ? LEVEL_BOX_CLASS[point.level] : NO_DATA_BOX_CLASS
  }

  if (exhibitionId === null) {
    return <p className="p-6 text-sm text-danger">잘못된 박람회 경로입니다.</p>
  }

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
        <h1 className="mb-1 text-xl font-extrabold tracking-tight text-ink lg:text-2xl">{exhibition.data?.title} 혼잡도 지도</h1>
        <p className="mb-5 text-sm text-muted">부스별 실시간 혼잡도를 지도에서 확인하세요.</p>

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

        <div className="relative">
          {/* 입구 표시 — 부스 배치 데이터와 무관한 순수 장식, 줌/팬과 상관없이 항상 왼쪽 가장자리에 고정(spec.md §3.4). */}
          <div className="pointer-events-none absolute left-1.5 top-1/2 z-10 -translate-y-1/2 border border-ink/40 bg-white/90 px-1.5 py-1 text-[10px] font-bold text-ink">
            입구
          </div>

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
                <FloorMap
                  booths={floorMapBooths}
                  renderBox={renderBox}
                  boxClassName={boxClassName}
                  onBoxClick={handleBoxClick}
                />
              </QueryState>
            </div>
          </div>
        </div>
      </QueryState>
    </div>
  )
}
