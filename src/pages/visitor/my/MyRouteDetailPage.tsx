import { Link, useParams } from 'react-router'
import { DetailLayout } from '../../../components/DetailLayout'
import { FloorMap } from '../../../components/FloorMap'
import { QueryState } from '../../../components/QueryState'
import { getBoothFootprint } from '../../../features/booth/floorLayout'
import { useBoothsByExhibition } from '../../../features/booth/hooks'
import { useRecommendedRoute } from '../../../features/route/hooks'
import type { RouteStopView } from '../../../lib/api/recommendedRoutes'
import { formatDateTime } from '../../../lib/format'
import type { Booth } from '../../../types'

const ROUTE_STATUS_LABEL: Record<string, string> = {
  CREATED: '생성됨',
  EXPIRED: '만료됨',
  DELETED: '삭제됨',
}

interface RouteFloorSegment {
  floor: number
  stops: RouteStopView[]
}

// stop.boothId로 booth.floor를 조회해 연속된 같은 floor를 하나의 구간으로 묶는다.
// floor를 못 찾으면(삭제된 booth 등) 그 stop은 지도에서만 생략한다(텍스트 리스트는 그대로 유지, spec.md §7-3).
function splitByFloor(stops: RouteStopView[], boothFloorById: Map<number, number>): RouteFloorSegment[] {
  const segments: RouteFloorSegment[] = []
  for (const stop of stops) {
    const floor = boothFloorById.get(stop.boothId)
    if (floor === undefined) continue

    const last = segments[segments.length - 1]
    if (last && last.floor === floor) {
      last.stops.push(stop)
    } else {
      segments.push({ floor, stops: [stop] })
    }
  }
  return segments
}

function RouteFloorMapSection({ stops, booths }: { stops: RouteStopView[]; booths: Booth[] }) {
  const boothFloorById = new Map(booths.map((booth) => [booth.id, booth.floor]))
  const segments = splitByFloor(stops, boothFloorById)

  if (segments.length === 0) return null

  return (
    <div>
      <div className="mb-3 text-base font-bold text-ink">동선 지도</div>
      <div className="flex flex-col gap-3">
        {segments.map((segment, segmentIndex) => (
          <div key={`${segment.floor}-${segmentIndex}`}>
            {segmentIndex > 0 && (
              <div className="mb-3 text-center text-xs font-semibold text-muted">
                {segments[segmentIndex - 1].floor}층 → {segment.floor}층 이동
              </div>
            )}
            <div className="border border-line bg-surface" style={{ aspectRatio: '4 / 3' }}>
              <FloorMap
                booths={segment.stops.flatMap((stop) => {
                  // FloorMap에 넘기는 위치/크기는 stop.posX/posY가 아니라 authored footprint에서
                  // 조회한다(spec.md §4.1) — stop.posX/posY는 아래 RouteStopRow의 "위치 (x, y)"
                  // 텍스트 표시에는 그대로 쓰인다.
                  const footprint = getBoothFootprint(stop.boothId)
                  if (!footprint) return []
                  return [{ boothId: stop.boothId, name: stop.boothName, ...footprint }]
                })}
                connections={segment.stops.slice(1).map((stop, i) => ({
                  fromBoothId: segment.stops[i].boothId,
                  toBoothId: stop.boothId,
                }))}
                renderBox={(boxBooth) => {
                  const stop = segment.stops.find((s) => s.boothId === boxBooth.boothId)
                  return (
                    <span className="flex flex-col items-center gap-0.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        {stop?.visitOrder}
                      </span>
                      {stop?.visitOrder === 1 && <span className="text-[10px] font-bold text-primary">출발</span>}
                    </span>
                  )
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RouteStopRow({ stop, isLast }: { stop: RouteStopView; isLast: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex shrink-0 flex-col items-center">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-primary text-xs font-bold text-white">{stop.visitOrder}</span>
        {!isLast && <span className="mt-1 w-px flex-1 bg-line" />}
      </div>
      <div className="mb-3 flex-1 border border-line p-3.5">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-bold text-ink">{stop.boothName}</span>
          <span className="shrink-0 bg-surface px-2 py-0.5 text-[11px] font-bold text-primary">{stop.estMinutes}분</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">{stop.reason}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted">
          <span>위치 ({stop.posX}, {stop.posY})</span>
          {stop.congestionSnapshot !== null && <span>· 추천 당시 혼잡도 {stop.congestionSnapshot}명</span>}
        </div>
      </div>
    </div>
  )
}

export default function MyRouteDetailPage() {
  const { routeId } = useParams<{ routeId: string }>()
  const parsedRouteId = routeId && /^\d+$/.test(routeId) ? Number(routeId) : null

  const route = useRecommendedRoute(parsedRouteId)
  const booths = useBoothsByExhibition(route.data?.exhibitionId ?? null)

  if (parsedRouteId === null) {
    return <p className="p-6 text-sm text-danger">잘못된 동선 경로입니다.</p>
  }

  return (
    <div className="mx-auto w-full max-w-md p-5 lg:max-w-4xl lg:p-8">
      <Link to="/my/route" className="mb-4 inline-block text-xs font-semibold text-muted transition-colors hover:text-primary">
        ← 내 AI 동선
      </Link>

      <QueryState
        isLoading={route.isLoading}
        isError={route.isError}
        isEmpty={!route.isLoading && !route.isError && !route.data}
        emptyMessage="추천 동선을 찾을 수 없습니다."
        height={240}
      >
        {route.data && (
          <DetailLayout
            title={route.data.exhibitionTitle}
            subtitle={`${route.data.exhibitionVenue} · 예상 총 ${route.data.totalEstMinutes}분`}
            attributes={[
              { label: '예상 총 관람 시간', value: `${route.data.totalEstMinutes}분` },
              { label: '동선 상태', value: ROUTE_STATUS_LABEL[route.data.routeStatus] ?? route.data.routeStatus },
              { label: '추천 생성일', value: formatDateTime(route.data.createdAt) },
            ]}
          >
            <div className="bg-shell p-5 text-white">
              <div className="text-sm font-bold">전체 추천 사유</div>
              <p className="mt-2 text-sm leading-relaxed text-white/80">{route.data.rationale}</p>
            </div>

            {booths.data && <RouteFloorMapSection stops={route.data.stops} booths={booths.data} />}

            <div>
              <div className="mb-3 text-base font-bold text-ink">방문 순서 · {route.data.stops.length}곳</div>
              <div className="flex flex-col">
                {route.data.stops.map((stop, index) => (
                  <RouteStopRow key={stop.visitOrder} stop={stop} isLast={index === route.data!.stops.length - 1} />
                ))}
              </div>
            </div>
          </DetailLayout>
        )}
      </QueryState>
    </div>
  )
}
