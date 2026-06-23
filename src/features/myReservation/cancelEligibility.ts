import type { MyReservation, MyReservationAttendee } from '../../lib/api/myReservations'

// master-plan 3.2.1 부분 취소 정책 — 예약 전체 취소는 PAID에서만 일반 사용자에게 허용된다.
// CHECKED_IN은 "환불 요청 원칙상 불가, 관리자 예외만"이고 CANCELLED/REFUNDED는 이미 종결 상태다.
export function canCancelReservation(reservation: MyReservation): boolean {
  return reservation.status === 'PAID'
}

export function getReservationCancelBlockReason(reservation: MyReservation): string | null {
  if (reservation.status === 'CHECKED_IN') return '체크인 후에는 전체 취소가 제한됩니다. 관리자 문의로만 처리할 수 있습니다.'
  if (reservation.status === 'CANCELLED' || reservation.status === 'REFUNDED') return '이미 취소·환불된 예약입니다.'
  return null
}

// 부분 취소는 INDIVIDUAL에서만 허용한다. GROUP은 대표 QR 기반 이동이라 제한되며,
// 인원 조정이 필요하면 group_size를 줄이는 별도 수정 절차로 안내한다.
export function canCancelAttendee(reservation: MyReservation, attendee: MyReservationAttendee): boolean {
  if (reservation.movementMode !== 'INDIVIDUAL') return false
  if (reservation.status !== 'PAID') return false
  if (attendee.attendeeStatus !== 'ACTIVE') return false
  if (attendee.checkinStatus === 'CHECKED_IN') return false
  if (attendee.nameTagIssued) return false
  return true
}

export function getAttendeeCancelBlockReason(reservation: MyReservation, attendee: MyReservationAttendee): string | null {
  if (attendee.attendeeStatus !== 'ACTIVE') return null
  if (reservation.movementMode === 'GROUP') return null
  if (reservation.status !== 'PAID') return null
  if (attendee.checkinStatus === 'CHECKED_IN') return '체크인 완료 · 취소 불가'
  if (attendee.nameTagIssued) return '네임태그 발급됨 · 취소 불가'
  return null
}
