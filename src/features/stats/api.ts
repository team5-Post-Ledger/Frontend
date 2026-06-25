import { mockDelay } from '../../lib/api/mockClient'

export interface StatsSummary {
  visitCount: number
  visitCountDeltaPct: number
  avgDwellSeconds: number
  paidHeadcount: number
  checkedInHeadcount: number
}

export interface VisitTrendPoint {
  hour: string
  visitCount: number
}

export interface TopBoothStat {
  boothId: number
  name: string
  visitCount: number
}

const EMPTY_STATS_SUMMARY: StatsSummary = {
  visitCount: 0,
  visitCountDeltaPct: 0,
  avgDwellSeconds: 0,
  paidHeadcount: 0,
  checkedInHeadcount: 0,
}

const MOCK_STATS_SUMMARY: Record<number, StatsSummary> = {
  1: {
    visitCount: 3820,
    visitCountDeltaPct: 8.4,
    avgDwellSeconds: 872,
    paidHeadcount: 1240,
    checkedInHeadcount: 843,
  },
  3: {
    visitCount: 1260,
    visitCountDeltaPct: 3.1,
    avgDwellSeconds: 645,
    paidHeadcount: 420,
    checkedInHeadcount: 286,
  },
}

export async function getStatsSummary(exhibitionId: number): Promise<StatsSummary> {
  if (exhibitionId !== 1) {
    return mockDelay(MOCK_STATS_SUMMARY[exhibitionId] ?? EMPTY_STATS_SUMMARY)
  }

  return mockDelay({
    visitCount: 3820,
    visitCountDeltaPct: 8.4,
    avgDwellSeconds: 872,
    paidHeadcount: 1240,
    checkedInHeadcount: 843,
  })
}

const MOCK_VISIT_TREND: Record<number, VisitTrendPoint[]> = {
  3: [
    { hour: '09:00', visitCount: 64 },
    { hour: '10:00', visitCount: 118 },
    { hour: '11:00', visitCount: 176 },
    { hour: '12:00', visitCount: 142 },
    { hour: '13:00', visitCount: 158 },
    { hour: '14:00', visitCount: 205 },
    { hour: '15:00', visitCount: 238 },
    { hour: '16:00', visitCount: 184 },
    { hour: '17:00', visitCount: 96 },
    { hour: '18:00', visitCount: 42 },
  ],
}

export async function getVisitTrend(exhibitionId: number): Promise<VisitTrendPoint[]> {
  if (exhibitionId !== 1) {
    return mockDelay(MOCK_VISIT_TREND[exhibitionId] ?? [])
  }

  return mockDelay([
    { hour: '09:00', visitCount: 120 },
    { hour: '10:00', visitCount: 340 },
    { hour: '11:00', visitCount: 560 },
    { hour: '12:00', visitCount: 410 },
    { hour: '13:00', visitCount: 480 },
    { hour: '14:00', visitCount: 690 },
    { hour: '15:00', visitCount: 730 },
    { hour: '16:00', visitCount: 590 },
    { hour: '17:00', visitCount: 350 },
    { hour: '18:00', visitCount: 150 },
  ])
}

const MOCK_TOP_BOOTHS: Record<number, TopBoothStat[]> = {
  3: [
    { boothId: 13, name: 'Q-Robot Cooking Zone', visitCount: 214 },
    { boothId: 17, name: 'FoodTech AI Demo', visitCount: 186 },
    { boothId: 15, name: 'Plant-Based Tasting', visitCount: 144 },
    { boothId: 16, name: 'Smart Kitchen IoT', visitCount: 121 },
    { boothId: 19, name: 'Q-Robot B2B Desk', visitCount: 87 },
  ],
}

export async function getTopBooths(exhibitionId: number): Promise<TopBoothStat[]> {
  if (exhibitionId !== 1) {
    return mockDelay(MOCK_TOP_BOOTHS[exhibitionId] ?? [])
  }

  return mockDelay([
    { boothId: 12, name: 'AI Factory', visitCount: 482 },
    { boothId: 31, name: '그린팩', visitCount: 417 },
    { boothId: 8, name: '스마트로보틱스', visitCount: 366 },
    { boothId: 19, name: '클라우드엣지', visitCount: 298 },
    { boothId: 24, name: '바이오헬스랩', visitCount: 251 },
  ])
}

export interface BoothFlowNode {
  boothId: number
  name: string
}

export interface BoothTransition {
  fromBoothId: number
  toBoothId: number
  count: number
}

export interface TopRoutePath {
  boothIds: number[]
  count: number
}

// §9.1 "동선 흐름 = attendee별 scanned_at 정렬 시퀀스 → 인접 부스쌍 전이행렬", §6.6 stats/flow는
// stat_* 집계 테이블에 없어 원천 visit_log를 재집계한 결과다(§9 3계층 출처 원칙). 부스 노드는
// /admin/stats(getTopBooths)와 같은 5개를 재사용해 두 화면의 부스 명이 어긋나지 않게 한다.
// autoExitCount/totalExitCount는 visit_log.is_auto_exit=true인 EXIT 행 수 / 전체 EXIT 행 수다
// (§7.3 NEXT_ENTRY_AUTO·§7.5 TIMEOUT_AUTO로 합성된 EXIT 비중).
export interface BoothFlowSummary {
  nodes: BoothFlowNode[]
  transitions: BoothTransition[]
  topRoutes: TopRoutePath[]
  autoExitCount: number
  totalExitCount: number
}

const FLOW_NODES: BoothFlowNode[] = [
  { boothId: 12, name: 'AI Factory' },
  { boothId: 31, name: '그린팩' },
  { boothId: 8, name: '스마트로보틱스' },
  { boothId: 19, name: '클라우드엣지' },
  { boothId: 24, name: '바이오헬스랩' },
]

const FOOD_TECH_FLOW_NODES: BoothFlowNode[] = [
  { boothId: 13, name: 'Q-Robot Cooking Zone' },
  { boothId: 17, name: 'FoodTech AI Demo' },
  { boothId: 15, name: 'Plant-Based Tasting' },
  { boothId: 16, name: 'Smart Kitchen IoT' },
  { boothId: 19, name: 'Q-Robot B2B Desk' },
]

const MOCK_BOOTH_FLOW: Record<number, BoothFlowSummary> = {
  1: {
    nodes: FLOW_NODES,
    transitions: [
      { fromBoothId: 12, toBoothId: 8, count: 86 },
      { fromBoothId: 12, toBoothId: 19, count: 54 },
      { fromBoothId: 8, toBoothId: 12, count: 41 },
      { fromBoothId: 8, toBoothId: 31, count: 37 },
      { fromBoothId: 31, toBoothId: 19, count: 63 },
      { fromBoothId: 31, toBoothId: 24, count: 28 },
      { fromBoothId: 19, toBoothId: 31, count: 45 },
      { fromBoothId: 19, toBoothId: 24, count: 33 },
      { fromBoothId: 24, toBoothId: 12, count: 19 },
      { fromBoothId: 24, toBoothId: 31, count: 22 },
    ],
    topRoutes: [
      { boothIds: [12, 8, 31], count: 64 },
      { boothIds: [31, 19, 24], count: 52 },
      { boothIds: [12, 19, 31, 24], count: 38 },
      { boothIds: [24, 12, 8], count: 21 },
    ],
    autoExitCount: 312,
    totalExitCount: 845,
  },
  3: {
    nodes: FOOD_TECH_FLOW_NODES,
    transitions: [
      { fromBoothId: 13, toBoothId: 17, count: 42 },
      { fromBoothId: 13, toBoothId: 15, count: 31 },
      { fromBoothId: 17, toBoothId: 16, count: 36 },
      { fromBoothId: 17, toBoothId: 19, count: 24 },
      { fromBoothId: 15, toBoothId: 16, count: 29 },
      { fromBoothId: 16, toBoothId: 19, count: 18 },
      { fromBoothId: 19, toBoothId: 13, count: 12 },
    ],
    topRoutes: [
      { boothIds: [13, 17, 16], count: 34 },
      { boothIds: [13, 15, 16, 19], count: 27 },
      { boothIds: [17, 19, 13], count: 16 },
    ],
    autoExitCount: 84,
    totalExitCount: 286,
  },
}

export async function getBoothFlow(exhibitionId: number): Promise<BoothFlowSummary | null> {
  return mockDelay(MOCK_BOOTH_FLOW[exhibitionId] ?? null)
}
