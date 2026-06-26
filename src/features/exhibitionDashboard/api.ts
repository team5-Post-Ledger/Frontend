import { mockDelay } from '../../lib/api/mockClient'
import { getReservations, type ReservationListItem } from '../../lib/api/reservations'

export interface ExhibitionOperationsSummary {
  reservedHeadcount: number
  paidHeadcount: number
  checkedInHeadcount: number
  grossRevenue: number
  onlineRevenue: number
  onsiteRevenue: number
  feeAmount: number
}

// reservation_attendee.attendee_status=ACTIVE 기준 실인원(§5.3). GROUP은 대표 1행만 있어도 생성 규칙상
// reservation.group_size가 곧 인원수다(부분취소 데모는 INDIVIDUAL에만 적용된다 — §3.2.1).
function headcountOf(reservation: ReservationListItem): number {
  if (reservation.movementMode === 'GROUP') return reservation.groupSize
  return reservation.attendees.filter((attendee) => attendee.attendeeStatus === 'ACTIVE').length
}

// GROUP은 대표 1회 스캔으로 head_count=group_size 전체가 입장 처리된다(§7.2·§9.1 "GROUP 방문 반영").
function checkedInWeightOf(reservation: ReservationListItem): number {
  if (reservation.movementMode === 'GROUP') {
    const leaderCheckedIn = reservation.attendees.some((attendee) => attendee.isGroupLeader && attendee.checkinStatus === 'CHECKED_IN')
    return leaderCheckedIn ? reservation.groupSize : 0
  }
  return reservation.attendees.filter((attendee) => attendee.attendeeStatus === 'ACTIVE' && attendee.checkinStatus === 'CHECKED_IN').length
}

async function getScopedReservations(exhibitionId: number): Promise<ReservationListItem[]> {
  return getReservations(exhibitionId)
}

// §9.2 정산 지표 그대로 집계한다: 총매출=sum(payment.amount where PAID), 온라인=PAID and
// pg_provider != ONSITE, 현장=PAID and pg_provider = ONSITE. reservation.payment(§5.3)을 직접 더한다.
export async function getExhibitionOperationsSummary(exhibitionId: number): Promise<ExhibitionOperationsSummary> {
  const reservations = await getScopedReservations(exhibitionId)

  const summary = reservations.reduce<ExhibitionOperationsSummary>(
    (acc, reservation) => {
      if (reservation.status !== 'CANCELLED' && reservation.status !== 'REFUNDED') {
        acc.reservedHeadcount += headcountOf(reservation)
      }
      if (reservation.status === 'PAID' || reservation.status === 'CHECKED_IN') {
        acc.paidHeadcount += headcountOf(reservation)
      }
      acc.checkedInHeadcount += checkedInWeightOf(reservation)

      if (reservation.payment?.status === 'PAID') {
        acc.grossRevenue += reservation.payment.amount
        acc.feeAmount += reservation.payment.feeAmount
        if (reservation.payment.pgProvider === 'ONSITE') {
          acc.onsiteRevenue += reservation.payment.amount
        } else {
          acc.onlineRevenue += reservation.payment.amount
        }
      }

      return acc
    },
    { reservedHeadcount: 0, paidHeadcount: 0, checkedInHeadcount: 0, grossRevenue: 0, onlineRevenue: 0, onsiteRevenue: 0, feeAmount: 0 },
  )

  return mockDelay(summary)
}

export interface CheckinTrendPoint {
  hour: string
  checkedInCount: number
}

// 시간대별 입장(GATE ENTRY, §7) 추이 목 시리즈. 실제로는 §6.6 GET /exhibitions/{id}/stats/heatmap이
// stat_congestion_hourly(§5.4, 시간대 배치 집계)를 반환할 자리다 — 지금은 행사별 고정 시드만 둔다.
const MOCK_CHECKIN_TREND: Record<number, CheckinTrendPoint[]> = {
  1: [
    { hour: '09:00', checkedInCount: 18 },
    { hour: '10:00', checkedInCount: 42 },
    { hour: '11:00', checkedInCount: 65 },
    { hour: '12:00', checkedInCount: 58 },
    { hour: '13:00', checkedInCount: 47 },
    { hour: '14:00', checkedInCount: 53 },
    { hour: '15:00', checkedInCount: 39 },
    { hour: '16:00', checkedInCount: 24 },
    { hour: '17:00', checkedInCount: 11 },
  ],
}

export async function getExhibitionCheckinTrend(exhibitionId: number): Promise<CheckinTrendPoint[]> {
  return mockDelay(MOCK_CHECKIN_TREND[exhibitionId] ?? [])
}
