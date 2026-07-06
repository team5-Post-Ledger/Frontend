import type { MovementMode, PaymentGatewayProvider } from '../../types'
import { formatSlotRange } from '../../features/timeSlot/format'
import { USE_MOCK } from './config'
import { apiPost } from './httpClient'
import { createOnsitePaymentForReservation, createPaidReservation } from './mockDb'
import { getExhibition } from './exhibitions'
import { mockDelay } from './mockClient'
import { createReservation, type ReservationListItem } from './reservations'
import { getTicketTypes } from './ticketTypes'
import { getTimeSlots } from './timeSlots'

export interface PaymentAttendeeInput {
  name: string
  phone: string
  email?: string
  isGroupLeader: boolean
}

export type PaymentMethod = 'card' | 'transfer' | 'easy'

// payment.pg_provider(§5)는 자유 문자열이라, 사용자가 고른 결제 수단을 시드와 같은
// 한국어 라벨('신용카드(국민)' 식 표기)로 기록한다. 실제 PG 연동 시 PG사 응답 값으로 대체된다.
const PAYMENT_METHOD_PG_LABELS: Record<PaymentMethod, string> = {
  card: '신용·체크카드',
  transfer: '계좌이체',
  easy: '간편결제',
}

export interface PaymentSubmissionInput {
  exhibitionId: number
  timeSlotId: number
  ticketTypeId: number
  movementMode: MovementMode
  groupSize: number
  attendees: PaymentAttendeeInput[]
  amount: number
  paymentMethod: PaymentMethod
  gatewayProvider?: PaymentGatewayProvider
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

interface PaymentInitiateResult {
  orderId: string
  amount: number
}

// 실 백엔드 결제 플로우(2026-07-06 실측으로 검증한 3단계):
//   1) POST /api/reservations         → 예약 생성(PENDING) + reservationId
//   2) POST /api/payments/initiate    → READY Payment 생성 + orderId (pgProvider: "TOSS"|"PORTONE")
//   3) POST /api/reservations/{id}/confirm-paid → PAID 확정 (개발용 샷컷: 실 PG 결제창/webhook 대체)
// 실 PG SDK 연동 시 3)을 PortOne/Toss 위젯 + webhook 확정으로 교체한다.
async function submitPaymentReal(input: PaymentSubmissionInput): Promise<PaymentSubmissionResult> {
  try {
    const reservation = await createReservation({
      exhibitionId: input.exhibitionId,
      timeSlotId: input.timeSlotId,
      ticketTypeId: input.ticketTypeId,
      movementMode: input.movementMode,
      groupSize: input.groupSize,
      attendees: input.attendees.map((attendee) => ({
        name: attendee.name,
        phone: attendee.phone,
        email: attendee.email,
        isGroupLeader: attendee.isGroupLeader,
      })),
    })

    await apiPost<PaymentInitiateResult>('visitor', '/api/payments/initiate', {
      reservationId: reservation.reservationId,
      exhibitionId: input.exhibitionId,
      amount: input.amount,
      pgProvider: input.gatewayProvider ?? 'PORTONE',
    })

    await apiPost<null>('visitor', `/api/reservations/${reservation.reservationId}/confirm-paid`)

    return {
      success: true,
      reservationId: reservation.reservationId,
      reservationCode: `RSV-${reservation.reservationId}`,
      paidAt: new Date().toISOString(),
      amount: input.amount,
    }
  } catch (error) {
    // SLOT_SOLD_OUT(409)·검증 실패 등은 httpClient가 ApiError(message)로 던진다 → 화면 실패 사유로 표시.
    return { success: false, failureReason: error instanceof Error ? error.message : '결제 처리에 실패했습니다.' }
  }
}

export async function submitPayment(input: PaymentSubmissionInput): Promise<PaymentSubmissionResult> {
  if (!USE_MOCK) return submitPaymentReal(input)

  /**
   * (mock) 백엔드 없이 PG 응답을 모킹해 성공/실패만 흉내낸다. USE_MOCK=false면 위 submitPaymentReal이 실행된다.
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
    pgProvider: PAYMENT_METHOD_PG_LABELS[input.paymentMethod],
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

export async function recordReservationOnsitePayment(reservation: ReservationListItem): Promise<ReservationListItem> {
  const paidAt = new Date().toISOString()

  try {
    const payment = createOnsitePaymentForReservation(reservation.id, reservation.amount)
    return mockDelay({
      ...reservation,
      status: 'PAID',
      payment: {
        pgProvider: payment.pgProvider,
        pgTxId: payment.pgTxId,
        amount: payment.amount,
        feeAmount: payment.feeAmount,
        status: payment.status,
        paidAt: payment.paidAt,
      },
    })
  } catch {
    return mockDelay({
      ...reservation,
      status: 'PAID',
      payment: {
        pgProvider: 'ONSITE',
        pgTxId: `ONSITE-${reservation.id}-${Date.now()}`,
        amount: reservation.amount,
        feeAmount: 0,
        status: 'PAID',
        paidAt,
      },
    })
  }
}
