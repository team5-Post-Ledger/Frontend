import { FloorMap } from '../../components/FloorMap'
import { getBoothFootprint } from '../booth/floorLayout'
import type { RouteStopView } from '../../lib/api/recommendedRoutes'
import type { Booth } from '../../types'

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

// MyRouteDetailPage와 혼잡도 허브의 "AI 동선" 탭이 공유하는 동선 지도(task-map-fix2/spec.md §7).
// 박스 색은 옅은 primary 톤으로 고정 — 혼잡도 지도의 레벨색 팔레트와 겹치지 않게 해서 "이 지도는
// 혼잡도가 아니라 방문 순서를 보여준다"는 걸 색으로도 구분한다(feature.md §7).
export function RouteFloorMapSection({ stops, booths }: { stops: RouteStopView[]; booths: Booth[] }) {
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
                boxClassName={() => 'bg-primary/5'}
                renderBox={(boxBooth) => {
                  const stop = segment.stops.find((s) => s.boothId === boxBooth.boothId)
                  return (
                    <span className="flex flex-col items-center gap-1 px-1 text-center">
                      <span className="line-clamp-1 w-full text-[11px] font-bold text-ink">{boxBooth.name}</span>
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
