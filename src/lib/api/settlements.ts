import type { Settlement, SettlementStatus } from '../../types'
import { mockDelay } from './mockClient'

// 공유 변경 가능 스토어 — generateSettlement 결과가 즉시 목록에 반영됨
let SETTLEMENTS: Settlement[] = [
  {
    id: 1,
    exhibitionId: 12,
    periodStart: '2026-03-10',
    periodEnd: '2026-03-12',
    onlineAmount: 4800000,
    onsiteAmount: 1500000,
    grossAmount: 6300000,   // = onlineAmount + onsiteAmount
    feeAmount: 315000,
    adRevenue: 0,
    netPayout: 5985000,     // = grossAmount - feeAmount + adRevenue
    status: 'PAID_OUT',
    generatedAt: '2026-03-14T09:00:00',
    paidOutAt: '2026-03-20T14:30:00',
  },
  {
    id: 2,
    exhibitionId: 1,
    periodStart: '2026-09-01',
    periodEnd: '2026-09-03',
    onlineAmount: 15200000,
    onsiteAmount: 3200000,
    grossAmount: 18400000,
    feeAmount: 920000,
    adRevenue: 1200000,
    netPayout: 18680000,    // = 18400000 - 920000 + 1200000
    status: 'CONFIRMED',
    generatedAt: '2026-09-05T10:00:00',
    paidOutAt: null,
  },
  {
    id: 3,
    exhibitionId: 13,
    periodStart: '2027-03-03',
    periodEnd: '2027-03-05',
    onlineAmount: 2900000,
    onsiteAmount: 800000,
    grossAmount: 3700000,
    feeAmount: 185000,
    adRevenue: 580000,
    netPayout: 4095000,     // = 3700000 - 185000 + 580000
    status: 'PENDING',
    generatedAt: '2027-03-07T08:30:00',
    paidOutAt: null,
  },
]

// 행사 제목 룩업 (platform mock과 id 일치)
const EXHIBITION_TITLES: Record<number, string> = {
  1: '2026 서울 스마트팩토리 박람회',
  12: '2026 부산 국제수산엑스포',
  13: '2027 스마트시티 박람회',
}

export interface SettlementSummary extends Settlement {
  exhibitionTitle: string
}

export interface GetSettlementsParams {
  exhibitionId?: number
  status?: SettlementStatus
}

export interface GenerateSettlementInput {
  exhibitionId: number
  periodStart: string
  periodEnd: string
}

function toSummary(s: Settlement): SettlementSummary {
  return {
    ...s,
    exhibitionTitle: EXHIBITION_TITLES[s.exhibitionId] ?? `행사 #${s.exhibitionId}`,
  }
}

function nextId(): number {
  return Math.max(0, ...SETTLEMENTS.map((s) => s.id)) + 1
}

// GET /api/settlements?exhibitionId=&status=
export async function getSettlements(
  params: GetSettlementsParams = {},
): Promise<SettlementSummary[]> {
  let result = SETTLEMENTS.slice()

  if (params.exhibitionId !== undefined) {
    result = result.filter((s) => s.exhibitionId === params.exhibitionId)
  }
  if (params.status !== undefined) {
    result = result.filter((s) => s.status === params.status)
  }

  // 최신 생성순 정렬
  result.sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1))

  return mockDelay(result.map(toSummary), 400)
}

// POST /api/settlements/generate
// 실제 API는 period 내 payment.status=PAID 건을 집계한다.
// 목에서는 전시 매출 시드 비율을 기반으로 결정론적 값을 생성한다.
export async function generateSettlement(
  input: GenerateSettlementInput,
): Promise<SettlementSummary> {
  const base = EXHIBITION_TITLES[input.exhibitionId]
    ? input.exhibitionId * 1000000 + 500000
    : 500000

  const onlineAmount = Math.round(base * 0.76)
  const onsiteAmount = Math.round(base * 0.24)
  const grossAmount = onlineAmount + onsiteAmount
  const feeAmount = Math.round(grossAmount * 0.05)
  const adRevenue = input.exhibitionId === 1 ? 400000 : 0
  const netPayout = grossAmount - feeAmount + adRevenue

  const created: Settlement = {
    id: nextId(),
    exhibitionId: input.exhibitionId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    onlineAmount,
    onsiteAmount,
    grossAmount,
    feeAmount,
    adRevenue,
    netPayout,
    status: 'PENDING',
    generatedAt: new Date().toISOString(),
    paidOutAt: null,
  }

  SETTLEMENTS = [created, ...SETTLEMENTS]
  return mockDelay(toSummary(created), 500)
}
