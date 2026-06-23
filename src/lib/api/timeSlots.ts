import type { TimeSlot } from '../../types'
import { mockDelay } from './mockClient'

const MOCK_TIME_SLOTS: TimeSlot[] = [
  { id: 1, exhibitionId: 1, startAt: '2026-09-01T10:00:00', endAt: '2026-09-01T13:00:00', capacity: 200, reservedCount: 72 },
  { id: 2, exhibitionId: 1, startAt: '2026-09-01T13:00:00', endAt: '2026-09-01T16:00:00', capacity: 200, reservedCount: 158 },
  { id: 3, exhibitionId: 1, startAt: '2026-09-02T10:00:00', endAt: '2026-09-02T13:00:00', capacity: 200, reservedCount: 200 },
  { id: 4, exhibitionId: 1, startAt: '2026-09-02T13:00:00', endAt: '2026-09-02T16:00:00', capacity: 200, reservedCount: 40 },
  { id: 5, exhibitionId: 2, startAt: '2026-10-14T10:00:00', endAt: '2026-10-14T13:00:00', capacity: 150, reservedCount: 30 },
  { id: 6, exhibitionId: 2, startAt: '2026-10-14T13:00:00', endAt: '2026-10-14T16:00:00', capacity: 150, reservedCount: 90 },
  { id: 7, exhibitionId: 3, startAt: '2026-06-24T10:00:00', endAt: '2026-06-24T13:00:00', capacity: 180, reservedCount: 60 },
  { id: 8, exhibitionId: 3, startAt: '2026-06-24T13:00:00', endAt: '2026-06-24T16:00:00', capacity: 180, reservedCount: 175 },
  { id: 9, exhibitionId: 3, startAt: '2026-06-25T10:00:00', endAt: '2026-06-25T13:00:00', capacity: 180, reservedCount: 20 },
]

export async function getTimeSlots(exhibitionId: number): Promise<TimeSlot[]> {
  return mockDelay(MOCK_TIME_SLOTS.filter((slot) => slot.exhibitionId === exhibitionId))
}
