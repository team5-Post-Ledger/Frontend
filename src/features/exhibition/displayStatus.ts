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

  const today = new Date().toISOString().slice(0, 10)

  if (exhibition.status === 'OPEN' && today >= exhibition.startDate && today <= exhibition.endDate) {
    return { label: '진행중', badgeClassName: 'bg-live text-ink' }
  }

  return { label: '예약중', badgeClassName: 'border border-primary bg-white text-primary' }
}
