import type { CheckinStatus, ReservationStatus } from '../../types'

export interface StatusBadge {
  label: string
  badgeClassName: string
}

const PAYMENT_BADGES: Record<ReservationStatus, StatusBadge> = {
  PENDING: { label: '미결제', badgeClassName: 'bg-warning text-white' },
  PAID: { label: '결제완료', badgeClassName: 'bg-success text-white' },
  CHECKED_IN: { label: '결제완료', badgeClassName: 'bg-success text-white' },
  CANCELLED: { label: '취소', badgeClassName: 'bg-line text-muted' },
  REFUNDED: { label: '환불', badgeClassName: 'bg-line text-muted' },
}

export function getPaymentStatusBadge(status: ReservationStatus): StatusBadge {
  return PAYMENT_BADGES[status]
}

export type CheckinSummary = 'NONE' | 'PARTIAL' | 'CHECKED_IN'

const CHECKIN_BADGES: Record<CheckinSummary, StatusBadge> = {
  NONE: { label: '미입장', badgeClassName: 'bg-line text-muted' },
  PARTIAL: { label: '부분입장', badgeClassName: 'bg-warning text-white' },
  CHECKED_IN: { label: '입장완료', badgeClassName: 'bg-success text-white' },
}

export function getCheckinSummary(item: { attendees: Array<{ checkinStatus: CheckinStatus }> }): CheckinSummary {
  const checkedIn = item.attendees.filter((attendee) => attendee.checkinStatus === 'CHECKED_IN').length
  if (checkedIn === 0) return 'NONE'
  if (checkedIn === item.attendees.length) return 'CHECKED_IN'
  return 'PARTIAL'
}

export function getCheckinBadge(summary: CheckinSummary): StatusBadge {
  return CHECKIN_BADGES[summary]
}
