import type { CheckinMethod, MovementMode } from '../../types'
import { mockDelay } from './mockClient'

export interface RecentCheckinView {
  id: number
  attendeeName: string
  groupSize: number
  movementMode: MovementMode
  checkinMethod: CheckinMethod
  minutesAgo: number
}

const MOCK_RECENT_CHECKINS: RecentCheckinView[] = [
  { id: 1, attendeeName: '김방문', groupSize: 3, movementMode: 'GROUP', checkinMethod: 'QR_SELF', minutesAgo: 0 },
  { id: 2, attendeeName: '이참석', groupSize: 1, movementMode: 'INDIVIDUAL', checkinMethod: 'QR_SELF', minutesAgo: 1 },
  { id: 3, attendeeName: '최게스트', groupSize: 2, movementMode: 'GROUP', checkinMethod: 'MANUAL_SEARCH', minutesAgo: 3 },
  { id: 4, attendeeName: '한방문', groupSize: 1, movementMode: 'INDIVIDUAL', checkinMethod: 'QR_SELF', minutesAgo: 5 },
  { id: 5, attendeeName: '윤참가', groupSize: 4, movementMode: 'GROUP', checkinMethod: 'WALK_IN', minutesAgo: 7 },
]

export async function getRecentCheckins(): Promise<RecentCheckinView[]> {
  return mockDelay(MOCK_RECENT_CHECKINS)
}
