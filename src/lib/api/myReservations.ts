import type { AttendeeStatus, CheckinStatus, MovementMode, ReservationStatus } from '../../types'
import { mockDelay } from './mockClient'

export interface MyReservationAttendee {
  id: number
  name: string
  phone: string | null
  isGroupLeader: boolean
  checkinStatus: CheckinStatus
  attendeeStatus: AttendeeStatus
  ticketQrToken: string | null
  // 네임태그가 이미 발급된 attendee는 일반 사용자 부분취소를 차단한다 (master-plan 3.2.1 부분 취소 정책 6).
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
  // 결제 시 확정된 총액 = 결제 시점 group_size × ticket_type.price (master-plan 3.1, payment.amount에 해당).
  // 이후 부분취소가 일어나도 원결제 총액은 바뀌지 않는다 — "결제 금액"과 "환불액"은 분리해서 보여준다.
  paymentAmount: number
  // 부분/전체 취소로 환불된 누적액 = 취소 인원 × 단가 (master-plan 3.2 부분 취소 정책 3).
  refundedAmount: number
}

// GROUP은 대표만 ticket_qr_token이 발급된다 (master-plan 5.3) — 대표가 아닌 GROUP 참석자는 null.
const mockMyReservations: MyReservation[] = [
  {
    id: 501,
    exhibitionId: 1,
    exhibitionTitle: '2026 서울 스마트팩토리 박람회',
    exhibitionVenue: '코엑스 1전시장',
    slotLabel: '09.01(화) 10:00–13:00',
    movementMode: 'GROUP',
    groupSize: 2,
    status: 'PAID',
    ticketTypeName: '유료 입장',
    unitPrice: 30000,
    createdAt: '2026-08-20T14:21:00',
    paymentAmount: 60000,
    refundedAmount: 0,
    attendees: [
      {
        id: 1,
        name: '김민수',
        phone: '010-1111-1111',
        isGroupLeader: true,
        checkinStatus: 'NOT_CHECKED_IN',
        attendeeStatus: 'ACTIVE',
        ticketQrToken: 'QR-TOKEN-501-1',
        nameTagIssued: false,
      },
      {
        id: 2,
        name: '이동행',
        phone: '010-2222-2222',
        isGroupLeader: false,
        checkinStatus: 'NOT_CHECKED_IN',
        attendeeStatus: 'ACTIVE',
        ticketQrToken: null,
        nameTagIssued: false,
      },
    ],
  },
  {
    id: 502,
    // 방문 리포트(§6.13) 시드가 실제 부스 데이터(lib/api/booths.ts)와 조인되도록 박람회 1로 둔다 —
    // 박람회 2에는 시드된 부스가 없다. attendees/movementMode는 그대로 두고 박람회 컨텍스트만 맞춘다.
    exhibitionId: 1,
    exhibitionTitle: '2026 서울 스마트팩토리 박람회',
    exhibitionVenue: '코엑스 1전시장',
    slotLabel: '09.01(화) 13:00–16:00',
    movementMode: 'INDIVIDUAL',
    groupSize: 1,
    status: 'CHECKED_IN',
    ticketTypeName: '유료 입장',
    unitPrice: 25000,
    createdAt: '2026-09-30T09:05:00',
    paymentAmount: 25000,
    refundedAmount: 0,
    attendees: [
      {
        id: 3,
        name: '김민수',
        phone: '010-1111-1111',
        isGroupLeader: false,
        checkinStatus: 'CHECKED_IN',
        attendeeStatus: 'ACTIVE',
        ticketQrToken: 'QR-TOKEN-502-1',
        nameTagIssued: true,
      },
    ],
  },
  {
    id: 503,
    exhibitionId: 3,
    exhibitionTitle: '2026 부산 푸드테크 박람회',
    exhibitionVenue: 'BEXCO 제1전시장',
    slotLabel: '06.24(수) 10:00–13:00',
    movementMode: 'INDIVIDUAL',
    // 참석자 1명(박참석)이 이미 부분취소된 상태로 시드된다 — group_size는 현재 유효 인원(1명)을 따른다.
    groupSize: 1,
    status: 'PAID',
    ticketTypeName: '유료 입장',
    unitPrice: 20000,
    createdAt: '2026-06-10T16:40:00',
    // 원결제는 2명 기준 40000 — 그중 1명분 20000이 이미 환불된 상태.
    paymentAmount: 40000,
    refundedAmount: 20000,
    attendees: [
      {
        id: 4,
        name: '김민수',
        phone: '010-1111-1111',
        isGroupLeader: false,
        checkinStatus: 'NOT_CHECKED_IN',
        attendeeStatus: 'ACTIVE',
        ticketQrToken: 'QR-TOKEN-503-1',
        nameTagIssued: false,
      },
      {
        id: 5,
        name: '박참석',
        phone: '010-3333-3333',
        isGroupLeader: false,
        checkinStatus: 'NOT_CHECKED_IN',
        attendeeStatus: 'CANCELLED',
        ticketQrToken: null,
        nameTagIssued: false,
      },
    ],
  },
  {
    id: 504,
    exhibitionId: 1,
    exhibitionTitle: '2026 서울 스마트팩토리 박람회',
    exhibitionVenue: '코엑스 1전시장',
    slotLabel: '09.02(수) 13:00–16:00',
    movementMode: 'INDIVIDUAL',
    groupSize: 3,
    status: 'PAID',
    ticketTypeName: '유료 입장',
    unitPrice: 30000,
    createdAt: '2026-08-25T11:10:00',
    paymentAmount: 90000,
    refundedAmount: 0,
    attendees: [
      // INDIVIDUAL은 참석자 각자 ticket_qr_token이 발급된다 (master-plan 5.3) — 대표 개념 없음.
      {
        id: 6,
        name: '최단체',
        phone: '010-4444-4444',
        isGroupLeader: false,
        checkinStatus: 'NOT_CHECKED_IN',
        attendeeStatus: 'ACTIVE',
        ticketQrToken: 'QR-TOKEN-504-1',
        nameTagIssued: false,
      },
      {
        id: 7,
        name: '한도윤',
        phone: '010-5555-5555',
        isGroupLeader: false,
        checkinStatus: 'NOT_CHECKED_IN',
        attendeeStatus: 'ACTIVE',
        ticketQrToken: 'QR-TOKEN-504-2',
        // 체크인 전이지만 네임태그를 미리 수령한 경우 — 부분취소 차단 데모.
        nameTagIssued: true,
      },
      {
        id: 8,
        name: '오세준',
        phone: '010-6666-6666',
        isGroupLeader: false,
        checkinStatus: 'NOT_CHECKED_IN',
        attendeeStatus: 'ACTIVE',
        ticketQrToken: 'QR-TOKEN-504-3',
        nameTagIssued: false,
      },
    ],
  },
]

export async function getMyReservations(): Promise<MyReservation[]> {
  return mockDelay(mockMyReservations)
}

export async function getMyReservation(id: number): Promise<MyReservation | null> {
  return mockDelay(mockMyReservations.find((reservation) => reservation.id === id) ?? null)
}

// 전체 취소/환불 — master-plan 3.2.1: PAID → REFUNDED, 참석자 전원 attendee_status=CANCELLED, QR 무효화.
// paymentAmount(원결제 총액)는 그대로 두고, refundedAmount만 전액으로 갱신한다 — 결제 금액과 환불액은 분리된 값이다.
export async function cancelReservation(reservationId: number): Promise<MyReservation> {
  const reservation = mockMyReservations.find((item) => item.id === reservationId)
  if (!reservation) throw new Error('예약을 찾을 수 없습니다.')

  reservation.status = 'REFUNDED'
  reservation.attendees.forEach((attendee) => {
    if (attendee.attendeeStatus === 'ACTIVE') {
      attendee.attendeeStatus = 'CANCELLED'
      attendee.ticketQrToken = null
    }
  })
  reservation.refundedAmount = reservation.paymentAmount

  return mockDelay(reservation)
}

// 참석자 단위 부분 취소 — master-plan 3.2.1: PAID 유지, 해당 attendee만 CANCELLED + QR 무효화, group_size 조정.
// refundedAmount만 취소 인원 × 단가(3.2 정책 3)로 누적하고, paymentAmount(원결제 총액)는 건드리지 않는다.
export async function cancelReservationAttendees(reservationId: number, attendeeIds: number[]): Promise<MyReservation> {
  const reservation = mockMyReservations.find((item) => item.id === reservationId)
  if (!reservation) throw new Error('예약을 찾을 수 없습니다.')

  let cancelledCount = 0
  reservation.attendees.forEach((attendee) => {
    if (attendeeIds.includes(attendee.id) && attendee.attendeeStatus === 'ACTIVE') {
      attendee.attendeeStatus = 'CANCELLED'
      attendee.ticketQrToken = null
      cancelledCount += 1
    }
  })
  reservation.groupSize = Math.max(0, reservation.groupSize - cancelledCount)
  reservation.refundedAmount += cancelledCount * reservation.unitPrice

  return mockDelay(reservation)
}
