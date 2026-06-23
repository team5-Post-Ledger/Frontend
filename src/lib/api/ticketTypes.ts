import type { TicketType } from '../../types'
import { mockDelay } from './mockClient'

const MOCK_TICKET_TYPES: TicketType[] = [
  { id: 1, exhibitionId: 1, name: '무료 입장', price: 0, quota: 5000 },
  { id: 2, exhibitionId: 1, name: '유료 입장', price: 30000, quota: 2000 },
  { id: 3, exhibitionId: 1, name: 'VIP', price: 120000, quota: 100 },
  { id: 4, exhibitionId: 2, name: '무료 입장', price: 0, quota: 3000 },
  { id: 5, exhibitionId: 2, name: '유료 입장', price: 25000, quota: 1500 },
  { id: 6, exhibitionId: 3, name: '무료 입장', price: 0, quota: 4000 },
  { id: 7, exhibitionId: 3, name: '유료 입장', price: 20000, quota: 1800 },
  { id: 8, exhibitionId: 3, name: 'VIP', price: 80000, quota: 80 },
]

export async function getTicketTypes(exhibitionId: number): Promise<TicketType[]> {
  return mockDelay(MOCK_TICKET_TYPES.filter((ticket) => ticket.exhibitionId === exhibitionId))
}
