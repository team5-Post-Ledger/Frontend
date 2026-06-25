import type { MovementMode } from '../../types'
import { formatSlotRange } from '../../features/timeSlot/format'
import { createPaidReservation } from './mockDb'
import { getExhibition } from './exhibitions'
import { mockDelay } from './mockClient'
import { getTicketTypes } from './ticketTypes'
import { getTimeSlots } from './timeSlots'

export interface PaymentAttendeeInput {
  name: string
  phone: string
  email?: string
  isGroupLeader: boolean
}

export interface PaymentSubmissionInput {
  exhibitionId: number
  timeSlotId: number
  ticketTypeId: number
  movementMode: MovementMode
  groupSize: number
  attendees: PaymentAttendeeInput[]
  amount: number
}

export interface PaymentSubmissionResult {
  success: boolean
  reservationId?: number
  reservationCode?: string
  pgTxId?: string
  paidAt?: string
  amount?: number
  failureReason?: string
}

export async function submitPayment(input: PaymentSubmissionInput): Promise<PaymentSubmissionResult> {
  /**
   * TODO(포트원 연동 지점): 백엔드 PG 연동이 준비되면 이 함수 본문을 아래 흐름으로 교체한다.
   * 1. POST /api/reservations로 예약(PENDING)을 먼저 생성한다 (group_size, movement_mode, attendees 포함).
   * 2. 포트원(PortOne) SDK로 결제창을 호출해 결제 수단별 인증·승인을 진행한다.
   * 3. 콜백으로 받은 paymentId(imp_uid/merchant_uid)를 POST /api/payments로 서버에 전달해 금액을 재검증한다.
   * 4. 최종 승인 여부는 POST /api/payments/webhook(PG → 서버) 결과로 확정한다(클라이언트 응답만 믿지 않는다).
   * 지금은 백엔드가 없으므로 위 과정을 거치지 않고 PG 응답을 모킹해 성공/실패만 흉내낸다.
   */
  const isSuccess = Math.random() > 0.15

  if (!isSuccess) {
    return mockDelay(
      { success: false, failureReason: '카드 한도 초과 또는 PG 응답 오류로 결제가 거절되었습니다.' },
      1200,
    )
  }

  const [exhibition, timeSlots, ticketTypes] = await Promise.all([
    getExhibition(input.exhibitionId),
    getTimeSlots(input.exhibitionId),
    getTicketTypes(input.exhibitionId),
  ])
  const timeSlot = timeSlots.find((slot) => slot.id === input.timeSlotId)
  const ticketType = ticketTypes.find((ticket) => ticket.id === input.ticketTypeId)
  const created = createPaidReservation({
    userId: 1,
    exhibitionId: input.exhibitionId,
    timeSlotId: input.timeSlotId,
    ticketTypeId: input.ticketTypeId,
    movementMode: input.movementMode,
    groupSize: input.groupSize,
    attendees: input.attendees,
    amount: input.amount,
    exhibitionTitle: exhibition?.title ?? '박람회',
    exhibitionVenue: exhibition?.venue ?? '-',
    slotLabel: timeSlot ? formatSlotRange(timeSlot.startAt, timeSlot.endAt) : '-',
    ticketTypeName: ticketType?.name ?? '-',
    unitPrice: ticketType?.price ?? (input.groupSize > 0 ? Math.floor(input.amount / input.groupSize) : input.amount),
  })

  return mockDelay(
    {
      success: true,
      reservationId: created.reservation.id,
      reservationCode: `RSV-${created.reservation.id}`,
      pgTxId: created.payment.pgTxId,
      paidAt: created.payment.paidAt ?? undefined,
      amount: created.payment.amount,
    },
    1200,
  )
}
