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
