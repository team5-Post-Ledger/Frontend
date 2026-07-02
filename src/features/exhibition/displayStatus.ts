import { todayDateKey } from '../../lib/calendarGrid'
import type { Exhibition } from '../../types'

export interface ExhibitionDisplayStatus {
  label: string
  badgeClassName: string
}

export function getExhibitionDisplayStatus(
  exhibition: Pick<Exhibition, 'status' | 'startDate' | 'endDate'>,
): ExhibitionDisplayStatus {
  if (exhibition.status === 'CLOSED') {
    return { label: '종료', badgeClassName: 'bg-line text-muted' }
  }

  const today = todayDateKey()

  if (exhibition.status === 'OPEN' && today >= exhibition.startDate && today <= exhibition.endDate) {
    return { label: '진행중', badgeClassName: 'bg-live text-ink' }
  }

  return { label: '예약중', badgeClassName: 'border border-primary bg-white text-primary' }
}

export function isOngoingToday(exhibition: Pick<Exhibition, 'status' | 'startDate' | 'endDate'>): boolean {
  return getExhibitionDisplayStatus(exhibition).label === '진행중'
}
