import type { TicketType } from '../../types'
import { USE_MOCK } from './config'
import { apiGet } from './httpClient'
import { mockDelay } from './mockClient'

// 실 백엔드 GET /api/exhibitions/{id}/ticket-types 응답. price는 BigDecimal(JSON number),
// quota는 number(2026-07-06 실측). 엔티티의 createdAt/updatedAt은 화면에서 안 써서 버린다.
interface TicketTypeDto {
  id: number
  exhibitionId: number
  name: string
  price: number
  quota: number
}

function adaptTicketType(dto: TicketTypeDto): TicketType {
  return { id: dto.id, exhibitionId: dto.exhibitionId, name: dto.name, price: dto.price, quota: dto.quota }
}

let mockTicketTypes: TicketType[] = [
  { id: 1, exhibitionId: 1, name: '무료 입장', price: 0, quota: 5000 },
  { id: 2, exhibitionId: 1, name: '유료 입장', price: 30000, quota: 2000 },
  { id: 9, exhibitionId: 1, name: '조기예약 유료', price: 18000, quota: 600 },
  { id: 3, exhibitionId: 1, name: 'VIP', price: 120000, quota: 100 },
  { id: 4, exhibitionId: 2, name: '무료 입장', price: 0, quota: 3000 },
  { id: 5, exhibitionId: 2, name: '유료 입장', price: 25000, quota: 1500 },
  { id: 6, exhibitionId: 3, name: '무료 입장', price: 0, quota: 4000 },
  { id: 7, exhibitionId: 3, name: '유료 입장', price: 20000, quota: 1800 },
  { id: 8, exhibitionId: 3, name: 'VIP', price: 80000, quota: 80 },
]

// ticket_type(§5.3)에는 판매 수량 컬럼이 없다 — 실제로는 reservation.group_size 합계로 quota가
// 차감된다. 백엔드가 없는 지금은 판매 수량을 시드로 흉내내어 "남은 쿼터"를 계산한다.
// id=3(VIP)은 품절 임박 케이스다.
const mockSoldCounts: Record<number, number> = {
  1: 1820,
  2: 870,
  9: 540,
  3: 93,
  4: 600,
  5: 320,
  6: 700,
  7: 410,
  8: 35,
}

let nextTicketTypeId = 10

export async function getTicketTypes(exhibitionId: number): Promise<TicketType[]> {
  if (USE_MOCK) return mockDelay(mockTicketTypes.filter((ticket) => ticket.exhibitionId === exhibitionId))
  const dtos = await apiGet<TicketTypeDto[]>('visitor', `/api/exhibitions/${exhibitionId}/ticket-types`)
  return dtos.map(adaptTicketType)
}

export function getRemainingQuota(ticketType: TicketType): number {
  const soldCount = mockSoldCounts[ticketType.id] ?? 0
  return Math.max(0, ticketType.quota - soldCount)
}

export type TicketTypeInput = Omit<TicketType, 'id' | 'exhibitionId'>

export async function createTicketType(exhibitionId: number, input: TicketTypeInput): Promise<TicketType> {
  const ticketType: TicketType = { id: nextTicketTypeId++, exhibitionId, ...input }
  mockTicketTypes = [...mockTicketTypes, ticketType]
  return mockDelay(ticketType)
}

export async function updateTicketType(id: number, input: TicketTypeInput): Promise<TicketType> {
  const exhibitionId = mockTicketTypes.find((ticket) => ticket.id === id)?.exhibitionId ?? 1
  const ticketType: TicketType = { id, exhibitionId, ...input }
  mockTicketTypes = mockTicketTypes.map((ticket) => (ticket.id === id ? ticketType : ticket))
  return mockDelay(ticketType)
}

export async function deleteTicketType(id: number): Promise<void> {
  mockTicketTypes = mockTicketTypes.filter((ticket) => ticket.id !== id)
  await mockDelay(undefined)
}
