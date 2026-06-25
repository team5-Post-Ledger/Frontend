import type { Exhibition, RouteStatus } from '../../types'
import { getBoothsByExhibition } from './booths'
import { getExhibition } from './exhibitions'
import { mockDelay } from './mockClient'

export interface RouteStopView {
  visitOrder: number
  boothId: number
  boothName: string
  posX: number
  posY: number
  estMinutes: number
  reason: string
  congestionSnapshot: number | null
}

export interface RecommendedRouteDetail {
  id: number
  exhibitionId: number
  exhibitionTitle: string
  exhibitionVenue: string
  rationale: string
  totalEstMinutes: number
  routeStatus: RouteStatus
  createdAt: string
  stops: RouteStopView[]
}

export interface RecommendedRouteSummary {
  id: number
  exhibitionId: number
  exhibitionTitle: string
  routeStatus: RouteStatus
  createdAt: string
  stopCount: number
  totalEstMinutes: number
}

export interface CreateRecommendedRouteInput {
  exhibitionId: number
  interestText: string
  availableMinutes: number
  mustVisitBoothIds: number[]
  startGate: string
}

export interface CreateRecommendedRouteResult {
  routeId: number
  totalEstMinutes: number
  rationale: string
  stops: Array<{ visitOrder: number; boothId: number; estMinutes: number; reason: string }>
}

interface MockRouteStop {
  visitOrder: number
  boothId: number
  estMinutes: number
  reason: string
  congestionSnapshot: number | null
}

interface MockRouteRecord {
  id: number
  exhibitionId: number
  rationale: string
  routeStatus: RouteStatus
  createdAt: string
  stops: MockRouteStop[]
}

// §6.10 GET /api/recommendations/me · POST /api/recommendations/route 목 데이터.
// CREATED 3건(서로 다른 행사 포함) + EXPIRED 1건, stop 2~6곳으로 목록 뱃지 구분과 상세
// 타임라인의 혼잡도 칸(실제 값/null 혼재)을 둘 다 검증할 수 있게 한다.
let mockRoutes: MockRouteRecord[] = [
  {
    id: 79,
    exhibitionId: 3,
    rationale: '푸드테크·로봇조리·콜드체인 관심사와 관련성이 높은 부스를 우선 배치하고, 혼잡도가 낮은 순서로 정렬했습니다.',
    routeStatus: 'CREATED',
    createdAt: '2026-06-23T09:15:00',
    stops: [
      { visitOrder: 1, boothId: 13, estMinutes: 18, reason: '필수 방문 부스이며 관심사(로봇조리)와 직접 관련됩니다.', congestionSnapshot: 20 },
      { visitOrder: 2, boothId: 14, estMinutes: 12, reason: '콜드체인 키워드와 관련도가 높고 현재 혼잡도가 낮습니다.', congestionSnapshot: 5 },
      { visitOrder: 3, boothId: 15, estMinutes: 15, reason: '대체식품 시식 체험으로 관심사와 유사도가 높습니다.', congestionSnapshot: null },
      { visitOrder: 4, boothId: 16, estMinutes: 14, reason: 'IoT 키친 쇼룸은 동선상 이동거리가 짧습니다.', congestionSnapshot: 11 },
      { visitOrder: 5, boothId: 17, estMinutes: 16, reason: 'AI 메뉴 추천 데모는 관심사와 직접 관련됩니다.', congestionSnapshot: 27 },
      { visitOrder: 6, boothId: 18, estMinutes: 10, reason: '친환경 포장재 전시는 혼잡도가 가장 낮아 마지막에 배치했습니다.', congestionSnapshot: 3 },
    ],
  },
  {
    id: 78,
    exhibitionId: 1,
    rationale: '클라우드 인프라와 핀테크 결제 관심사에 맞춰 관련 부스 두 곳만 짧게 묶었습니다.',
    routeStatus: 'CREATED',
    createdAt: '2026-06-22T15:30:00',
    stops: [
      { visitOrder: 1, boothId: 3, estMinutes: 20, reason: '클라우드 인프라 관심사와 직접 관련됩니다.', congestionSnapshot: 9 },
      { visitOrder: 2, boothId: 6, estMinutes: 16, reason: '핀테크 결제 키워드와 유사도가 높습니다.', congestionSnapshot: 14 },
    ],
  },
  {
    id: 77,
    exhibitionId: 1,
    rationale: 'AI·로보틱스·IoT 관심사와 관련성이 높은 부스를 우선 배치하고, 혼잡도가 낮은 순서로 정렬했습니다.',
    routeStatus: 'CREATED',
    createdAt: '2026-06-20T10:00:00',
    stops: [
      { visitOrder: 1, boothId: 1, estMinutes: 20, reason: '필수 방문 부스이며 관심사(AI)와 직접 관련됩니다.', congestionSnapshot: 12 },
      { visitOrder: 2, boothId: 5, estMinutes: 15, reason: 'IoT 태그와 관련도가 높고 현재 혼잡도가 낮습니다.', congestionSnapshot: 6 },
      { visitOrder: 3, boothId: 2, estMinutes: 20, reason: '로보틱스 관심사와 유사도가 높습니다.', congestionSnapshot: null },
      { visitOrder: 4, boothId: 7, estMinutes: 18, reason: '라이브 데모 시간에 맞춰 방문하면 대기시간이 짧습니다.', congestionSnapshot: 18 },
    ],
  },
  {
    id: 70,
    exhibitionId: 1,
    rationale: '데이터·IoT 관심사로 만든 동선이며, 추천 유효 기간이 지나 만료되었습니다.',
    routeStatus: 'EXPIRED',
    createdAt: '2026-05-02T11:00:00',
    stops: [
      { visitOrder: 1, boothId: 4, estMinutes: 18, reason: '데이터 파이프라인 관심사와 직접 관련됩니다.', congestionSnapshot: 15 },
      { visitOrder: 2, boothId: 9, estMinutes: 14, reason: '예지보전 센서 데모는 IoT 키워드와 유사도가 높습니다.', congestionSnapshot: 22 },
      { visitOrder: 3, boothId: 11, estMinutes: 10, reason: '네트워킹 라운지는 동선 마지막에 들르기 좋습니다.', congestionSnapshot: 8 },
    ],
  },
]

let nextRouteId = 80

async function loadExhibitionTitles(exhibitionIds: number[]): Promise<Map<number, Exhibition>> {
  const uniqueIds = Array.from(new Set(exhibitionIds))
  const exhibitions = await Promise.all(uniqueIds.map((id) => getExhibition(id)))
  return new Map(
    exhibitions
      .filter((exhibition): exhibition is Exhibition => exhibition !== null)
      .map((exhibition) => [exhibition.id, exhibition]),
  )
}

/**
 * GET /api/recommendations/{id} 목 구현(§6.10). recommended_route와 route_stop을 routeId로 조회해
 * booth(name/posX/posY)·exhibition(title/venue)을 조인한 응답을 흉내낸다.
 */
export async function getRecommendedRoute(routeId: number): Promise<RecommendedRouteDetail | null> {
  const record = mockRoutes.find((route) => route.id === routeId)
  if (!record) {
    return mockDelay(null)
  }

  const [exhibition, booths] = await Promise.all([getExhibition(record.exhibitionId), getBoothsByExhibition(record.exhibitionId)])
  if (!exhibition) {
    return mockDelay(null)
  }

  const stops: RouteStopView[] = record.stops.map((stop) => {
    const booth = booths.find((item) => item.id === stop.boothId)
    return {
      visitOrder: stop.visitOrder,
      boothId: stop.boothId,
      boothName: booth?.name ?? `부스 #${stop.boothId}`,
      posX: booth?.posX ?? 0,
      posY: booth?.posY ?? 0,
      estMinutes: stop.estMinutes,
      reason: stop.reason,
      congestionSnapshot: stop.congestionSnapshot,
    }
  })

  return mockDelay({
    id: record.id,
    exhibitionId: record.exhibitionId,
    exhibitionTitle: exhibition.title,
    exhibitionVenue: exhibition.venue,
    rationale: record.rationale,
    totalEstMinutes: stops.reduce((sum, stop) => sum + stop.estMinutes, 0),
    routeStatus: record.routeStatus,
    createdAt: record.createdAt,
    stops,
  })
}

/**
 * GET /api/recommendations/me?exhibitionId= 목 구현(§6.10). 삭제/숨김(DELETED) 이력은 제외하고
 * 최신 생성순으로 반환한다.
 */
export async function getMyRecommendedRoutes(exhibitionId?: number): Promise<RecommendedRouteSummary[]> {
  const visibleRoutes = mockRoutes.filter((route) => route.routeStatus !== 'DELETED')
  const records = exhibitionId === undefined ? visibleRoutes : visibleRoutes.filter((route) => route.exhibitionId === exhibitionId)

  const exhibitionById = await loadExhibitionTitles(records.map((route) => route.exhibitionId))

  const summaries = records
    .map((route) => ({
      id: route.id,
      exhibitionId: route.exhibitionId,
      exhibitionTitle: exhibitionById.get(route.exhibitionId)?.title ?? `행사 #${route.exhibitionId}`,
      routeStatus: route.routeStatus,
      createdAt: route.createdAt,
      stopCount: route.stops.length,
      totalEstMinutes: route.stops.reduce((sum, stop) => sum + stop.estMinutes, 0),
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  return mockDelay(summaries)
}

/**
 * POST /api/recommendations/route 목 구현(§6.10, §8.3). 후보는 해당 exhibition의 실제 부스로만
 * 구성해 존재하지 않는 booth_id가 저장되지 않게 한다. mustVisitBoothIds는 시간 제약과 무관하게
 * 우선 포함하고, 그 외 부스는 availableMinutes를 넘기기 전까지만 채운다.
 */
export async function createRecommendedRoute(input: CreateRecommendedRouteInput): Promise<CreateRecommendedRouteResult> {
  const booths = await getBoothsByExhibition(input.exhibitionId)
  const mustVisitBooths = booths.filter((booth) => input.mustVisitBoothIds.includes(booth.id))
  const otherBooths = booths.filter((booth) => !input.mustVisitBoothIds.includes(booth.id))

  const stops: MockRouteStop[] = []
  let accumulatedMinutes = 0

  for (const booth of [...mustVisitBooths, ...otherBooths]) {
    if (stops.length >= 6) break

    const isMustVisit = input.mustVisitBoothIds.includes(booth.id)
    if (!isMustVisit && stops.length > 0 && accumulatedMinutes >= input.availableMinutes) continue

    const estMinutes = 10 + Math.round(Math.random() * 12)
    stops.push({
      visitOrder: stops.length + 1,
      boothId: booth.id,
      estMinutes,
      reason: isMustVisit
        ? `필수 방문 부스이며 "${input.interestText}" 관심사와 직접 관련됩니다.`
        : `"${input.interestText}" 관심사와 관련도가 높은 부스입니다.`,
      congestionSnapshot: 3 + Math.round(Math.random() * 27),
    })
    accumulatedMinutes += estMinutes
  }

  const totalEstMinutes = stops.reduce((sum, stop) => sum + stop.estMinutes, 0)
  const rationale =
    stops.length > 0
      ? `"${input.interestText}" 관심사와 가용 시간 ${input.availableMinutes}분을 반영해 관련성이 높고 혼잡도가 낮은 부스를 우선 배치했습니다.`
      : '관심사와 일치하는 부스를 찾지 못했습니다. 관심사를 다르게 입력해 다시 시도해 주세요.'

  const record: MockRouteRecord = {
    id: nextRouteId++,
    exhibitionId: input.exhibitionId,
    rationale,
    routeStatus: 'CREATED',
    createdAt: new Date().toISOString(),
    stops,
  }
  mockRoutes = [record, ...mockRoutes]

  return mockDelay({
    routeId: record.id,
    totalEstMinutes,
    rationale,
    stops: stops.map(({ visitOrder, boothId, estMinutes, reason }) => ({ visitOrder, boothId, estMinutes, reason })),
  })
}
