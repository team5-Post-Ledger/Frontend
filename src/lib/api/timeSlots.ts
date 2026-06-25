import type { TimeSlot } from '../../types'
import { mockDelay } from './mockClient'

let mockTimeSlots: TimeSlot[] = [
  { id: 1, exhibitionId: 1, startAt: '2026-09-01T10:00:00', endAt: '2026-09-01T13:00:00', capacity: 200, reservedCount: 72 },
  { id: 2, exhibitionId: 1, startAt: '2026-09-01T13:00:00', endAt: '2026-09-01T16:00:00', capacity: 200, reservedCount: 158 },
  { id: 3, exhibitionId: 1, startAt: '2026-09-02T10:00:00', endAt: '2026-09-02T13:00:00', capacity: 200, reservedCount: 200 },
  { id: 4, exhibitionId: 1, startAt: '2026-09-02T13:00:00', endAt: '2026-09-02T16:00:00', capacity: 200, reservedCount: 40 },
  { id: 10, exhibitionId: 1, startAt: '2026-09-02T16:00:00', endAt: '2026-09-02T19:00:00', capacity: 200, reservedCount: 184 },
  { id: 5, exhibitionId: 2, startAt: '2026-10-14T10:00:00', endAt: '2026-10-14T13:00:00', capacity: 150, reservedCount: 30 },
  { id: 6, exhibitionId: 2, startAt: '2026-10-14T13:00:00', endAt: '2026-10-14T16:00:00', capacity: 150, reservedCount: 90 },
  { id: 7, exhibitionId: 3, startAt: '2026-06-24T10:00:00', endAt: '2026-06-24T13:00:00', capacity: 180, reservedCount: 60 },
  { id: 8, exhibitionId: 3, startAt: '2026-06-24T13:00:00', endAt: '2026-06-24T16:00:00', capacity: 180, reservedCount: 175 },
  { id: 9, exhibitionId: 3, startAt: '2026-06-25T10:00:00', endAt: '2026-06-25T13:00:00', capacity: 180, reservedCount: 20 },
]

let nextTimeSlotId = 11

export async function getTimeSlots(exhibitionId: number): Promise<TimeSlot[]> {
  return mockDelay(mockTimeSlots.filter((slot) => slot.exhibitionId === exhibitionId))
}

// reservedCount는 폼으로 직접 편집하지 않는다(§3.2) — 예약 생성/취소 시 원자 UPDATE로만 증감하는
// 값이라 관리자는 capacity·시간만 조정한다. 신규 슬롯은 reservedCount=0에서 시작한다.
export type TimeSlotInput = Omit<TimeSlot, 'id' | 'exhibitionId' | 'reservedCount'>

export async function createTimeSlot(exhibitionId: number, input: TimeSlotInput): Promise<TimeSlot> {
  const slot: TimeSlot = { id: nextTimeSlotId++, exhibitionId, reservedCount: 0, ...input }
  mockTimeSlots = [...mockTimeSlots, slot]
  return mockDelay(slot)
}

export async function updateTimeSlot(id: number, input: TimeSlotInput): Promise<TimeSlot> {
  const existing = mockTimeSlots.find((slot) => slot.id === id)
  const slot: TimeSlot = { id, exhibitionId: existing?.exhibitionId ?? 1, reservedCount: existing?.reservedCount ?? 0, ...input }
  mockTimeSlots = mockTimeSlots.map((item) => (item.id === id ? slot : item))
  return mockDelay(slot)
}

export async function deleteTimeSlot(id: number): Promise<void> {
  mockTimeSlots = mockTimeSlots.filter((slot) => slot.id !== id)
  await mockDelay(undefined)
}
