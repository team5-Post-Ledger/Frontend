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

// GET /api/settlements/{id}
export async function getSettlement(id: number): Promise<SettlementSummary> {
  await new Promise((r) => setTimeout(r, 300))
  const s = SETTLEMENTS.find((item) => item.id === id)
  if (!s) throw new Error('정산을 찾을 수 없습니다.')
  return toSummary(s)
}

// PATCH /api/settlements/{id}/confirm — PENDING→CONFIRMED, 저장소 갱신
export async function confirmSettlement(id: number): Promise<SettlementSummary> {
  const idx = SETTLEMENTS.findIndex((item) => item.id === id)
  if (idx === -1) throw new Error('정산을 찾을 수 없습니다.')
  const s = SETTLEMENTS[idx]
  if (s.status !== 'PENDING') throw new Error('PENDING 상태에서만 확정할 수 있습니다.')
  const updated: Settlement = { ...s, status: 'CONFIRMED' }
  SETTLEMENTS = SETTLEMENTS.map((item, i) => (i === idx ? updated : item))
  return mockDelay(toSummary(updated), 400)
}

// PATCH /api/settlements/{id}/paid-out — CONFIRMED→PAID_OUT, paidOutAt 채움, 저장소 갱신
export async function payoutSettlement(id: number): Promise<SettlementSummary> {
  const idx = SETTLEMENTS.findIndex((item) => item.id === id)
  if (idx === -1) throw new Error('정산을 찾을 수 없습니다.')
  const s = SETTLEMENTS[idx]
  if (s.status !== 'CONFIRMED') throw new Error('CONFIRMED 상태에서만 지급 처리할 수 있습니다.')
  const updated: Settlement = { ...s, status: 'PAID_OUT', paidOutAt: new Date().toISOString() }
  SETTLEMENTS = SETTLEMENTS.map((item, i) => (i === idx ? updated : item))
  return mockDelay(toSummary(updated), 400)
}

// GET /api/settlements/{id}/export?format=xlsx|pdf
// 목: 최소 blob 다운로드만 수행. 실 전환 시 이 함수 본문만 axios blob 호출로 교체.
export async function exportSettlement(id: number, format: 'xlsx' | 'pdf'): Promise<void> {
  await new Promise((r) => setTimeout(r, 300))
  const s = SETTLEMENTS.find((item) => item.id === id)
  if (!s) throw new Error('정산을 찾을 수 없습니다.')
  const content = [
    `정산 ID: ${id}`,
    `행사 ID: ${s.exhibitionId}`,
    `기간: ${s.periodStart} ~ ${s.periodEnd}`,
    `총매출: ${s.grossAmount.toLocaleString()}원`,
    `수수료: ${s.feeAmount.toLocaleString()}원`,
    `광고수익: ${s.adRevenue.toLocaleString()}원`,
    `순지급액: ${s.netPayout.toLocaleString()}원`,
    `(목 다운로드 — 실 API 연결 시 교체)`,
  ].join('\n')
  const mimeType =
    format === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `settlement-${id}.${format}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
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
