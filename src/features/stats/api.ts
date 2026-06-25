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

export async function getStatsSummary(): Promise<StatsSummary> {
  return mockDelay({
    visitCount: 3820,
    visitCountDeltaPct: 8.4,
    avgDwellSeconds: 872,
    paidHeadcount: 1240,
    checkedInHeadcount: 843,
  })
}

export async function getVisitTrend(): Promise<VisitTrendPoint[]> {
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

export async function getTopBooths(): Promise<TopBoothStat[]> {
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
}

export async function getBoothFlow(exhibitionId: number): Promise<BoothFlowSummary | null> {
  return mockDelay(MOCK_BOOTH_FLOW[exhibitionId] ?? null)
}
