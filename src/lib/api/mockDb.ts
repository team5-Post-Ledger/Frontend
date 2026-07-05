import type {
  AttendeeStatus,
  CheckinMethod,
  CheckinStatus,
  MovementMode,
  PaymentStatus,
  PgProvider,
  ReservationSource,
  ReservationStatus,
} from '../../types'

export interface MockReservationRecord {
  id: number
  userId: number
  exhibitionId: number
  timeSlotId: number | null
  ticketTypeId: number | null
  movementMode: MovementMode
  groupSize: number
  status: ReservationStatus
  reservationSource: ReservationSource
  createdAt: string
  deletedAt: string | null
  exhibitionTitle: string
  exhibitionVenue: string
  slotLabel: string
  ticketTypeName: string
  unitPrice: number
}

export interface MockReservationAttendeeRecord {
  id: number
  reservationId: number
  exhibitionId: number
  linkedUserId: number | null
  name: string
  phone: string | null
  email: string | null
  isGroupLeader: boolean
  ticketQrToken: string | null
  checkinStatus: CheckinStatus
  attendeeStatus: AttendeeStatus
  checkedInAt: string | null
  deletedAt: string | null
  nameTagIssued: boolean
}

export interface MockPaymentRecord {
  id: number
  reservationId: number
  pgProvider: PgProvider
  pgTxId: string
  amount: number
  feeAmount: number
  status: PaymentStatus
  paidAt: string | null
  deletedAt: string | null
}

export interface CreatePaidReservationInput {
  userId: number
  exhibitionId: number
  timeSlotId: number
  ticketTypeId: number
  movementMode: MovementMode
  groupSize: number
  attendees: Array<{
    name: string
    phone: string
    email?: string
    isGroupLeader: boolean
  }>
  amount: number
  pgProvider: PgProvider
  exhibitionTitle: string
  exhibitionVenue: string
  slotLabel: string
  ticketTypeName: string
  unitPrice: number
}

export interface MockCheckinLogRecord {
  id: number
  reservationId: number
  attendeeId: number
  attendeeName: string
  nameTagId: number | null
  nameTagToken: string | null
  checkinMethod: CheckinMethod
  checkedInByUserId: number
  checkedInAt: string
  memo: string | null
}

export interface CreateWalkInReservationInput {
  exhibitionId: number
  ticketTypeId: number
  movementMode: MovementMode
  groupSize: number
  name: string
  phone: string
}

const MOCK_USER_ID = 1

let nextReservationId = 1000
let nextAttendeeId = 1000
let nextPaymentId = 1000

const reservations: MockReservationRecord[] = [
  {
    id: 501,
    userId: MOCK_USER_ID,
    exhibitionId: 1,
    timeSlotId: 1,
    ticketTypeId: 2,
    movementMode: 'GROUP',
    groupSize: 2,
    status: 'PAID',
    reservationSource: 'ONLINE',
    createdAt: '2026-08-20T14:21:00',
    deletedAt: null,
    exhibitionTitle: '2026 서울 스마트팩토리 박람회',
    exhibitionVenue: '코엑스 1전시장',
    slotLabel: '09.01(화) 10:00-13:00',
    ticketTypeName: '유료 입장',
    unitPrice: 30000,
  },
  {
    id: 502,
    userId: MOCK_USER_ID,
    exhibitionId: 1,
    timeSlotId: 2,
    ticketTypeId: 2,
    movementMode: 'INDIVIDUAL',
    groupSize: 1,
    status: 'CHECKED_IN',
    reservationSource: 'ONLINE',
    createdAt: '2026-09-30T09:05:00',
    deletedAt: null,
    exhibitionTitle: '2026 서울 스마트팩토리 박람회',
    exhibitionVenue: '코엑스 1전시장',
    slotLabel: '09.01(화) 13:00-16:00',
    ticketTypeName: '유료 입장',
    unitPrice: 25000,
  },
  {
    id: 503,
    userId: MOCK_USER_ID,
    exhibitionId: 3,
    timeSlotId: 7,
    ticketTypeId: 7,
    movementMode: 'INDIVIDUAL',
    groupSize: 1,
    status: 'PAID',
    reservationSource: 'ONLINE',
    createdAt: '2026-06-10T16:40:00',
    deletedAt: null,
    exhibitionTitle: '2026 부산 푸드테크 박람회',
    exhibitionVenue: 'BEXCO 제1전시장',
    slotLabel: '06.24(수) 10:00-13:00',
    ticketTypeName: '유료 입장',
    unitPrice: 20000,
  },
  {
    id: 504,
    userId: MOCK_USER_ID,
    exhibitionId: 1,
    timeSlotId: 4,
    ticketTypeId: 2,
    movementMode: 'INDIVIDUAL',
    groupSize: 3,
    status: 'PAID',
    reservationSource: 'ONLINE',
    createdAt: '2026-08-25T11:10:00',
    deletedAt: null,
    exhibitionTitle: '2026 서울 스마트팩토리 박람회',
    exhibitionVenue: '코엑스 1전시장',
    slotLabel: '09.02(수) 13:00-16:00',
    ticketTypeName: '유료 입장',
    unitPrice: 30000,
  },
]

const reservationAttendees: MockReservationAttendeeRecord[] = [
  {
    id: 1,
    reservationId: 501,
    exhibitionId: 1,
    linkedUserId: MOCK_USER_ID,
    name: '김민수',
    phone: '010-1111-1111',
    email: null,
    isGroupLeader: true,
    checkinStatus: 'NOT_CHECKED_IN',
    attendeeStatus: 'ACTIVE',
    ticketQrToken: 'QR-TOKEN-501-1',
    checkedInAt: null,
    deletedAt: null,
    nameTagIssued: false,
  },
  {
    id: 2,
    reservationId: 501,
    exhibitionId: 1,
    linkedUserId: null,
    name: '이동현',
    phone: '010-2222-2222',
    email: null,
    isGroupLeader: false,
    checkinStatus: 'NOT_CHECKED_IN',
    attendeeStatus: 'ACTIVE',
    ticketQrToken: null,
    checkedInAt: null,
    deletedAt: null,
    nameTagIssued: false,
  },
  {
    id: 3,
    reservationId: 502,
    exhibitionId: 1,
    linkedUserId: MOCK_USER_ID,
    name: '김민수',
    phone: '010-1111-1111',
    email: null,
    isGroupLeader: false,
    checkinStatus: 'CHECKED_IN',
    attendeeStatus: 'ACTIVE',
    ticketQrToken: 'QR-TOKEN-502-1',
    checkedInAt: '2026-09-30T09:50:00',
    deletedAt: null,
    nameTagIssued: true,
  },
  {
    id: 4,
    reservationId: 503,
    exhibitionId: 3,
    linkedUserId: MOCK_USER_ID,
    name: '김민수',
    phone: '010-1111-1111',
    email: null,
    isGroupLeader: false,
    checkinStatus: 'NOT_CHECKED_IN',
    attendeeStatus: 'ACTIVE',
    ticketQrToken: 'QR-TOKEN-503-1',
    checkedInAt: null,
    deletedAt: null,
    nameTagIssued: false,
  },
  {
    id: 5,
    reservationId: 503,
    exhibitionId: 3,
    linkedUserId: null,
    name: '박참석',
    phone: '010-3333-3333',
    email: null,
    isGroupLeader: false,
    checkinStatus: 'NOT_CHECKED_IN',
    attendeeStatus: 'CANCELLED',
    ticketQrToken: null,
    checkedInAt: null,
    deletedAt: null,
    nameTagIssued: false,
  },
  {
    id: 6,
    reservationId: 504,
    exhibitionId: 1,
    linkedUserId: MOCK_USER_ID,
    name: '최단체',
    phone: '010-4444-4444',
    email: null,
    isGroupLeader: false,
    checkinStatus: 'NOT_CHECKED_IN',
    attendeeStatus: 'ACTIVE',
    ticketQrToken: 'QR-TOKEN-504-1',
    checkedInAt: null,
    deletedAt: null,
    nameTagIssued: false,
  },
  {
    id: 7,
    reservationId: 504,
    exhibitionId: 1,
    linkedUserId: null,
    name: '서도윤',
    phone: '010-5555-5555',
    email: null,
    isGroupLeader: false,
    checkinStatus: 'NOT_CHECKED_IN',
    attendeeStatus: 'ACTIVE',
    ticketQrToken: 'QR-TOKEN-504-2',
    checkedInAt: null,
    deletedAt: null,
    nameTagIssued: true,
  },
  {
    id: 8,
    reservationId: 504,
    exhibitionId: 1,
    linkedUserId: null,
    name: '오세준',
    phone: '010-6666-6666',
    email: null,
    isGroupLeader: false,
    checkinStatus: 'NOT_CHECKED_IN',
    attendeeStatus: 'ACTIVE',
    ticketQrToken: 'QR-TOKEN-504-3',
    checkedInAt: null,
    deletedAt: null,
    nameTagIssued: false,
  },
]

const payments: MockPaymentRecord[] = [
  {
    id: 1,
    reservationId: 501,
    pgProvider: 'MOCK_PG',
    pgTxId: 'MOCK-501',
    amount: 60000,
    feeAmount: 0,
    status: 'PAID',
    paidAt: '2026-08-20T14:22:00',
    deletedAt: null,
  },
  {
    id: 2,
    reservationId: 502,
    pgProvider: 'MOCK_PG',
    pgTxId: 'MOCK-502',
    amount: 25000,
    feeAmount: 0,
    status: 'PAID',
    paidAt: '2026-09-30T09:06:00',
    deletedAt: null,
  },
  {
    id: 3,
    reservationId: 503,
    pgProvider: 'MOCK_PG',
    pgTxId: 'MOCK-503',
    amount: 40000,
    feeAmount: 0,
    status: 'PAID',
    paidAt: '2026-06-10T16:41:00',
    deletedAt: null,
  },
  {
    id: 4,
    reservationId: 504,
    pgProvider: 'MOCK_PG',
    pgTxId: 'MOCK-504',
    amount: 90000,
    feeAmount: 0,
    status: 'PAID',
    paidAt: '2026-08-25T11:11:00',
    deletedAt: null,
  },
]

// checkin_log(§5.4) 공유 저장소. 체크인 처리(lib/api/checkin.ts)와 예약 상세 타임라인
// (lib/api/reservations.ts)이 같은 기록을 봐야 하는데, 둘을 직접 연결하면
// reservations → checkin → nameTags → reservations 순환 import가 생겨 여기에 둔다.
// 시드 2건은 reservations.ts 정적 시드 예약(479·481)의 checkinLogs와 같은 사건이므로,
// 예약 상세 병합은 런타임 생성분(id >= RUNTIME_CHECKIN_LOG_START_ID)만 대상으로 한다.
const checkinLogs: MockCheckinLogRecord[] = [
  { id: 1, reservationId: 479, attendeeId: 1, attendeeName: '김도현', nameTagId: 13, nameTagToken: 'b2d5f8a1-0013-4b22-9c00-bb0000000013', checkinMethod: 'QR_SELF', checkedInByUserId: 1, checkedInAt: '2026-07-14T09:55:00', memo: null },
  { id: 2, reservationId: 481, attendeeId: 6, attendeeName: '박상우', nameTagId: 15, nameTagToken: 'b2d5f8a1-0015-4b22-9c00-bb0000000015', checkinMethod: 'QR_SELF', checkedInByUserId: 1, checkedInAt: '2026-07-14T12:52:00', memo: null },
]

const RUNTIME_CHECKIN_LOG_START_ID = 1000
let nextCheckinLogId = RUNTIME_CHECKIN_LOG_START_ID

export function appendMockCheckinLog(
  input: Omit<MockCheckinLogRecord, 'id' | 'checkedInAt'> & { checkedInAt?: string },
): MockCheckinLogRecord {
  const log: MockCheckinLogRecord = {
    ...input,
    id: nextCheckinLogId++,
    checkedInAt: input.checkedInAt ?? new Date().toISOString(),
  }
  checkinLogs.unshift(log)
  return log
}

export function getMockCheckinLogs(): MockCheckinLogRecord[] {
  return checkinLogs
}

export function getRuntimeCheckinLogsByReservationId(reservationId: number): MockCheckinLogRecord[] {
  return checkinLogs
    .filter((log) => log.reservationId === reservationId && log.id >= RUNTIME_CHECKIN_LOG_START_ID)
    .slice()
    .sort((a, b) => a.checkedInAt.localeCompare(b.checkedInAt))
}

function makeTicketQrToken(reservationId: number, attendeeId: number): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `TICKET-${crypto.randomUUID()}`
  }
  return `TICKET-${reservationId}-${attendeeId}-${Date.now()}`
}

function normalizeAttendees(input: CreatePaidReservationInput['attendees'], movementMode: MovementMode) {
  const attendees = input.length > 0 ? input : [{ name: '', phone: '', email: undefined, isGroupLeader: movementMode === 'GROUP' }]
  if (movementMode === 'GROUP' && !attendees.some((attendee) => attendee.isGroupLeader)) {
    return attendees.map((attendee, index) => ({ ...attendee, isGroupLeader: index === 0 }))
  }
  return attendees
}

export function getMockReservations(): MockReservationRecord[] {
  return reservations
}

export function getMockReservationAttendees(): MockReservationAttendeeRecord[] {
  return reservationAttendees
}

export function getMockPayments(): MockPaymentRecord[] {
  return payments
}

export function getMockPaymentByReservationId(reservationId: number): MockPaymentRecord | null {
  return payments.find((payment) => payment.reservationId === reservationId && payment.deletedAt === null) ?? null
}

export function createPaidReservation(input: CreatePaidReservationInput): {
  reservation: MockReservationRecord
  attendees: MockReservationAttendeeRecord[]
  payment: MockPaymentRecord
} {
  const reservationId = nextReservationId++
  const paidAt = new Date().toISOString()
  const attendeeInputs = normalizeAttendees(input.attendees, input.movementMode)

  const reservation: MockReservationRecord = {
    id: reservationId,
    userId: input.userId,
    exhibitionId: input.exhibitionId,
    timeSlotId: input.timeSlotId,
    ticketTypeId: input.ticketTypeId,
    movementMode: input.movementMode,
    groupSize: input.groupSize,
    status: 'PAID',
    reservationSource: 'ONLINE',
    createdAt: paidAt,
    deletedAt: null,
    exhibitionTitle: input.exhibitionTitle,
    exhibitionVenue: input.exhibitionVenue,
    slotLabel: input.slotLabel,
    ticketTypeName: input.ticketTypeName,
    unitPrice: input.unitPrice,
  }

  const createdAttendees = attendeeInputs.map((attendeeInput, index) => {
    const attendeeId = nextAttendeeId++
    const shouldIssueQr = input.movementMode === 'INDIVIDUAL' || attendeeInput.isGroupLeader || index === 0
    return {
      id: attendeeId,
      reservationId,
      exhibitionId: input.exhibitionId,
      linkedUserId: index === 0 ? input.userId : null,
      name: attendeeInput.name,
      phone: attendeeInput.phone || null,
      email: attendeeInput.email ?? null,
      isGroupLeader: input.movementMode === 'GROUP' ? attendeeInput.isGroupLeader || index === 0 : attendeeInput.isGroupLeader,
      ticketQrToken: shouldIssueQr ? makeTicketQrToken(reservationId, attendeeId) : null,
      checkinStatus: 'NOT_CHECKED_IN' as const,
      attendeeStatus: 'ACTIVE' as const,
      checkedInAt: null,
      deletedAt: null,
      nameTagIssued: false,
    }
  })

  const payment: MockPaymentRecord = {
    id: nextPaymentId++,
    reservationId,
    pgProvider: input.pgProvider,
    pgTxId: `MOCK-${Date.now()}`,
    amount: input.amount,
    feeAmount: 0,
    status: 'PAID',
    paidAt,
    deletedAt: null,
  }

  reservations.unshift(reservation)
  reservationAttendees.unshift(...createdAttendees)
  payments.unshift(payment)

  return { reservation, attendees: createdAttendees, payment }
}

export function createWalkInReservationRecord(input: CreateWalkInReservationInput): {
  reservation: MockReservationRecord
  attendees: MockReservationAttendeeRecord[]
} {
  const reservationId = nextReservationId++
  const createdAt = new Date().toISOString()
  const attendeeCount = input.movementMode === 'GROUP' ? 1 : input.groupSize

  const reservation: MockReservationRecord = {
    id: reservationId,
    userId: MOCK_USER_ID,
    exhibitionId: input.exhibitionId,
    timeSlotId: null,
    ticketTypeId: input.ticketTypeId,
    movementMode: input.movementMode,
    groupSize: input.groupSize,
    status: 'PENDING',
    reservationSource: 'ONSITE_MANUAL',
    createdAt,
    deletedAt: null,
    exhibitionTitle: '현장 등록',
    exhibitionVenue: '현장',
    slotLabel: '현장 등록',
    ticketTypeName: '현장 티켓',
    unitPrice: 0,
  }

  const createdAttendees = Array.from({ length: attendeeCount }, (_, index) => {
    const attendeeId = nextAttendeeId++
    const isGroupLeader = input.movementMode === 'GROUP' || index === 0
    return {
      id: attendeeId,
      reservationId,
      exhibitionId: input.exhibitionId,
      linkedUserId: null,
      name: index === 0 ? input.name : `${input.name} 동행 ${index + 1}`,
      phone: index === 0 ? input.phone : null,
      email: null,
      isGroupLeader,
      ticketQrToken: null,
      checkinStatus: 'NOT_CHECKED_IN' as const,
      attendeeStatus: 'ACTIVE' as const,
      checkedInAt: null,
      deletedAt: null,
      nameTagIssued: false,
    }
  })

  reservations.unshift(reservation)
  reservationAttendees.unshift(...createdAttendees)

  return { reservation, attendees: createdAttendees }
}

export function createOnsitePaymentForReservation(reservationId: number, amount: number): MockPaymentRecord {
  const reservation = reservations.find((item) => item.id === reservationId && item.deletedAt === null)
  if (!reservation) throw new Error('예약을 찾을 수 없습니다.')

  const paidAt = new Date().toISOString()
  const payment: MockPaymentRecord = {
    id: nextPaymentId++,
    reservationId,
    pgProvider: 'ONSITE',
    pgTxId: `ONSITE-${reservationId}-${Date.now()}`,
    amount,
    feeAmount: 0,
    status: 'PAID',
    paidAt,
    deletedAt: null,
  }

  payments.unshift(payment)
  if (reservation.status === 'PENDING') {
    reservation.status = 'PAID'
  }

  return payment
}

export function refundReservation(reservationId: number): MockReservationRecord {
  const reservation = reservations.find((item) => item.id === reservationId)
  if (!reservation) throw new Error('예약을 찾을 수 없습니다.')

  reservation.status = 'REFUNDED'
  reservationAttendees.forEach((attendee) => {
    if (attendee.reservationId === reservationId && attendee.attendeeStatus === 'ACTIVE') {
      attendee.attendeeStatus = 'CANCELLED'
      attendee.ticketQrToken = null
    }
  })

  const payment = getMockPaymentByReservationId(reservationId)
  if (payment) {
    payment.status = 'REFUNDED'
  }

  return reservation
}

export function cancelReservationAttendeeRecords(reservationId: number, attendeeIds: number[]): MockReservationRecord {
  const reservation = reservations.find((item) => item.id === reservationId)
  if (!reservation) throw new Error('예약을 찾을 수 없습니다.')

  let cancelledCount = 0
  reservationAttendees.forEach((attendee) => {
    if (attendee.reservationId === reservationId && attendeeIds.includes(attendee.id) && attendee.attendeeStatus === 'ACTIVE') {
      attendee.attendeeStatus = 'CANCELLED'
      attendee.ticketQrToken = null
      cancelledCount += 1
    }
  })

  reservation.groupSize = Math.max(0, reservation.groupSize - cancelledCount)
  return reservation
}

export interface AttendeeCheckinStatusRow {
  attendeeId: number
  name: string
  isGroupLeader: boolean
  checkinStatus: CheckinStatus
  attendeeStatus: AttendeeStatus
  checkedInAt: string | null
  nameTagIssued: boolean
}

export interface ReservationCheckinStatus {
  reservationId: number
  movementMode: MovementMode
  groupSize: number
  checkedInCount: number
  activeCount: number
  attendees: AttendeeCheckinStatusRow[]
}

// GET /api/checkin/reservations/{id}/status 대응 읽기 전용 게터 (§6.4).
// 쓰기 없음 — 상태 변경은 checkInReservationAttendeeRecord가 담당한다.
export function getReservationCheckinStatus(reservationId: number): ReservationCheckinStatus | null {
  const reservation = reservations.find((r) => r.id === reservationId && r.deletedAt === null)
  if (!reservation) return null

  const rows = reservationAttendees
    .filter((a) => a.reservationId === reservationId && a.deletedAt === null)
    .map((a) => ({
      attendeeId: a.id,
      name: a.name,
      isGroupLeader: a.isGroupLeader,
      checkinStatus: a.checkinStatus,
      attendeeStatus: a.attendeeStatus,
      checkedInAt: a.checkedInAt,
      nameTagIssued: a.nameTagIssued,
    }))

  const activeRows = rows.filter((r) => r.attendeeStatus === 'ACTIVE')

  return {
    reservationId,
    movementMode: reservation.movementMode,
    groupSize: reservation.groupSize,
    checkedInCount: activeRows.filter((r) => r.checkinStatus === 'CHECKED_IN').length,
    activeCount: activeRows.length,
    attendees: rows,
  }
}

export function checkInReservationAttendeeRecord(attendeeId: number, reservationId: number, checkedInAt = new Date().toISOString()): boolean {
  const attendee = reservationAttendees.find(
    (item) => item.id === attendeeId && item.reservationId === reservationId && item.deletedAt === null,
  )
  if (!attendee || attendee.attendeeStatus !== 'ACTIVE') return false

  attendee.checkinStatus = 'CHECKED_IN'
  attendee.checkedInAt = checkedInAt
  attendee.nameTagIssued = true

  const reservation = reservations.find((item) => item.id === reservationId && item.deletedAt === null)
  if (!reservation) return true

  const activeAttendees = reservationAttendees.filter(
    (item) => item.reservationId === reservationId && item.deletedAt === null && item.attendeeStatus === 'ACTIVE',
  )
  if (activeAttendees.length > 0 && activeAttendees.every((item) => item.checkinStatus === 'CHECKED_IN')) {
    reservation.status = 'CHECKED_IN'
  }

  return true
}
