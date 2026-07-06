// ⚠ 의도적으로 mock 유지(USE_MOCK 토글과 무관하게 항상 mock).
// 실 백엔드 GET /api/reservations/me는 Page<ReservationResponse>인데 ReservationResponse가 너무 얇다
// (reservationId/status/movementMode/groupSize/attendees만). exhibitionId·제목·슬롯·티켓명·금액·생성일이
// 없어 이 화면(내 예약/티켓)을 실API로 재구성할 수 없다. 백엔드 DTO 보강 후 변환한다
// (docs/database/current-contract.md §Phase2 보고 1). 부분 컷오버로 안전하게 mock을 남긴다.
import type { AttendeeStatus, CheckinStatus, MovementMode, ReservationStatus } from '../../types'
import { mockDelay } from './mockClient'
import {
  cancelReservationAttendeeRecords,
  getMockPaymentByReservationId,
  getMockReservationAttendees,
  getMockReservations,
  refundReservation,
  type MockReservationAttendeeRecord,
  type MockReservationRecord,
} from './mockDb'

export interface MyReservationAttendee {
  id: number
  name: string
  phone: string | null
  isGroupLeader: boolean
  checkinStatus: CheckinStatus
  attendeeStatus: AttendeeStatus
  ticketQrToken: string | null
  // 네임태그가 이미 발급된 attendee의 일반 사용자 부분취소를 차단한다.
  nameTagIssued: boolean
}

export interface MyReservation {
  id: number
  exhibitionId: number
  exhibitionTitle: string
  exhibitionVenue: string
  slotLabel: string
  movementMode: MovementMode
  groupSize: number
  status: ReservationStatus
  ticketTypeName: string
  unitPrice: number
  createdAt: string
  attendees: MyReservationAttendee[]
  paymentAmount: number
  refundedAmount: number
}

function toMyReservationAttendee(attendee: MockReservationAttendeeRecord): MyReservationAttendee {
  return {
    id: attendee.id,
    name: attendee.name,
    phone: attendee.phone,
    isGroupLeader: attendee.isGroupLeader,
    checkinStatus: attendee.checkinStatus,
    attendeeStatus: attendee.attendeeStatus,
    ticketQrToken: attendee.ticketQrToken,
    nameTagIssued: attendee.nameTagIssued,
  }
}

function toMyReservation(reservation: MockReservationRecord): MyReservation {
  const attendees = getMockReservationAttendees()
    .filter((attendee) => attendee.reservationId === reservation.id && attendee.deletedAt === null)
    .map(toMyReservationAttendee)
  const payment = getMockPaymentByReservationId(reservation.id)
  const cancelledCount = attendees.filter((attendee) => attendee.attendeeStatus === 'CANCELLED').length

  return {
    id: reservation.id,
    exhibitionId: reservation.exhibitionId,
    exhibitionTitle: reservation.exhibitionTitle,
    exhibitionVenue: reservation.exhibitionVenue,
    slotLabel: reservation.slotLabel,
    movementMode: reservation.movementMode,
    groupSize: reservation.groupSize,
    status: reservation.status,
    ticketTypeName: reservation.ticketTypeName,
    unitPrice: reservation.unitPrice,
    createdAt: reservation.createdAt,
    attendees,
    paymentAmount: payment?.amount ?? 0,
    refundedAmount: reservation.status === 'REFUNDED' ? (payment?.amount ?? 0) : cancelledCount * reservation.unitPrice,
  }
}

export async function getMyReservations(): Promise<MyReservation[]> {
  return mockDelay(
    getMockReservations()
      .filter((reservation) => reservation.deletedAt === null)
      .map(toMyReservation),
  )
}

export async function getMyReservation(id: number): Promise<MyReservation | null> {
  const reservation = getMockReservations().find((item) => item.id === id && item.deletedAt === null)
  return mockDelay(reservation ? toMyReservation(reservation) : null)
}

export async function cancelReservation(reservationId: number): Promise<MyReservation> {
  const reservation = refundReservation(reservationId)
  return mockDelay(toMyReservation(reservation))
}

export async function cancelReservationAttendees(reservationId: number, attendeeIds: number[]): Promise<MyReservation> {
  const reservation = cancelReservationAttendeeRecords(reservationId, attendeeIds)
  return mockDelay(toMyReservation(reservation))
}
