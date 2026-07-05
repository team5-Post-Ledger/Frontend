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
import { mockDelay } from './mockClient'
import {
  getMockPaymentByReservationId,
  getMockReservationAttendees,
  getMockReservations,
  getRuntimeCheckinLogsByReservationId,
  type MockCheckinLogRecord,
  type MockReservationAttendeeRecord,
  type MockReservationRecord,
} from './mockDb'

export interface ReservationAttendeeView {
  id: number
  name: string
  phone: string | null
  isGroupLeader: boolean
  checkinStatus: CheckinStatus
  attendeeStatus: AttendeeStatus
  checkedInAt: string | null
}

export interface CheckinLogView {
  id: number
  checkinMethod: CheckinMethod
  nameTagToken: string | null
  processedByName: string
  checkedInAt: string
  memo: string | null
}

export interface ReservationPaymentView {
  pgProvider: PgProvider
  pgTxId: string
  amount: number
  feeAmount: number
  status: PaymentStatus
  paidAt: string | null
}

export interface ReservationListItem {
  id: number
  representativeName: string
  representativePhone: string | null
  exhibitionTitle: string
  ticketTypeName: string
  groupSize: number
  movementMode: MovementMode
  status: ReservationStatus
  reservationSource: ReservationSource
  amount: number
  slotLabel: string
  createdAt: string
  payment: ReservationPaymentView | null
  attendees: ReservationAttendeeView[]
  checkinLogs: CheckinLogView[]
}

// checkin_log.checked_in_by_user_id(§5.4)는 이 목 데이터 전체에서 단일 운영 계정(id=1, lib/api/checkin.ts의
// CURRENT_STAFF_USER_ID·lib/api/nameTags.ts의 issuedByUserId와 동일)만 사용한다 — 표시용 이름만 고정.
const CHECKIN_PROCESSOR_NAME = '김태형(EXPO_ADMIN)'
const ADMIN_SEED_EXHIBITION_ID = 1

const MOCK_RESERVATIONS: ReservationListItem[] = [
  {
    id: 479,
    representativeName: '김도현',
    representativePhone: '010-2841-3920',
    exhibitionTitle: '2026 서울 스마트팩토리 박람회',
    ticketTypeName: '유료 입장',
    groupSize: 1,
    movementMode: 'INDIVIDUAL',
    status: 'CHECKED_IN',
    reservationSource: 'ONLINE',
    amount: 30000,
    slotLabel: '07.14(월) 10:00',
    createdAt: '2026-07-02T14:21:00',
    payment: {
      pgProvider: '신용카드(국민)',
      pgTxId: '30482914',
      amount: 30000,
      feeAmount: 900,
      status: 'PAID',
      paidAt: '2026-07-02T14:21:00',
    },
    attendees: [
      { id: 1, name: '김도현', phone: '010-2841-3920', isGroupLeader: true, checkinStatus: 'CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: '2026-07-14T09:58:00' },
    ],
    checkinLogs: [
      { id: 1, checkinMethod: 'QR_SELF', nameTagToken: 'b2d5f8a1-0013-4b22-9c00-bb0000000013', processedByName: CHECKIN_PROCESSOR_NAME, checkedInAt: '2026-07-14T09:58:00', memo: 'A홀 입구 · 단말 #02' },
    ],
  },
  {
    id: 480,
    representativeName: '이서연',
    representativePhone: '010-5532-1147',
    exhibitionTitle: '2026 서울 스마트팩토리 박람회',
    ticketTypeName: '유료 입장',
    groupSize: 4,
    movementMode: 'GROUP',
    status: 'PAID',
    reservationSource: 'ONLINE',
    amount: 120000,
    slotLabel: '07.14(월) 11:00',
    createdAt: '2026-07-03T09:05:00',
    payment: {
      pgProvider: '법인카드',
      pgTxId: '77120934',
      amount: 120000,
      feeAmount: 3600,
      status: 'PAID',
      paidAt: '2026-07-03T09:06:00',
    },
    attendees: [
      { id: 2, name: '이서연', phone: '010-5532-1147', isGroupLeader: true, checkinStatus: 'CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: '2026-07-14T10:42:00' },
      { id: 3, name: '박준호', phone: null, isGroupLeader: false, checkinStatus: 'CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: '2026-07-14T10:42:00' },
      { id: 4, name: '최민지', phone: null, isGroupLeader: false, checkinStatus: 'NOT_CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: null },
      { id: 5, name: '정우성', phone: null, isGroupLeader: false, checkinStatus: 'NOT_CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: null },
    ],
    checkinLogs: [
      { id: 2, checkinMethod: 'QR_SELF', nameTagToken: 'b2d5f8a1-0014-4b22-9c00-bb0000000014', processedByName: CHECKIN_PROCESSOR_NAME, checkedInAt: '2026-07-14T10:42:00', memo: 'A홀 입구 · 단말 #01 (2명)' },
    ],
  },
  {
    id: 481,
    representativeName: '박상우',
    representativePhone: '010-9920-4471',
    exhibitionTitle: '2026 서울 스마트팩토리 박람회',
    ticketTypeName: '유료 입장',
    groupSize: 6,
    movementMode: 'GROUP',
    status: 'CHECKED_IN',
    reservationSource: 'ONLINE',
    amount: 180000,
    slotLabel: '07.14(월) 13:00',
    createdAt: '2026-07-01T16:40:00',
    payment: {
      pgProvider: '세금계산서(계좌이체)',
      pgTxId: 'TX-4471-0029',
      amount: 180000,
      feeAmount: 0,
      status: 'PAID',
      paidAt: '2026-07-05T11:20:00',
    },
    attendees: [
      { id: 6, name: '박상우', phone: '010-9920-4471', isGroupLeader: true, checkinStatus: 'CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: '2026-07-14T12:55:00' },
      { id: 7, name: '한지민', phone: null, isGroupLeader: false, checkinStatus: 'CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: '2026-07-14T12:55:00' },
      { id: 8, name: '오세훈', phone: null, isGroupLeader: false, checkinStatus: 'CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: '2026-07-14T12:55:00' },
      { id: 9, name: '윤아름', phone: null, isGroupLeader: false, checkinStatus: 'CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: '2026-07-14T12:55:00' },
      { id: 10, name: '강동원', phone: null, isGroupLeader: false, checkinStatus: 'CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: '2026-07-14T12:55:00' },
      { id: 11, name: '서지혜', phone: null, isGroupLeader: false, checkinStatus: 'CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: '2026-07-14T12:55:00' },
    ],
    checkinLogs: [
      { id: 4, checkinMethod: 'ONSITE_MANUAL', nameTagToken: null, processedByName: CHECKIN_PROCESSOR_NAME, checkedInAt: '2026-07-14T12:50:00', memo: '네임태그 일괄 발급 · 운영데스크' },
      { id: 3, checkinMethod: 'QR_SELF', nameTagToken: 'b2d5f8a1-0015-4b22-9c00-bb0000000015', processedByName: CHECKIN_PROCESSOR_NAME, checkedInAt: '2026-07-14T12:55:00', memo: 'A홀 단체입구 · 단말 #04 (6명)' },
    ],
  },
  {
    id: 482,
    representativeName: '정해린',
    representativePhone: '010-3344-8821',
    exhibitionTitle: '2026 서울 스마트팩토리 박람회',
    ticketTypeName: '유료 입장',
    groupSize: 2,
    movementMode: 'GROUP',
    status: 'PENDING',
    reservationSource: 'ONLINE',
    amount: 60000,
    slotLabel: '07.15(화) 10:00',
    createdAt: '2026-07-08T20:11:00',
    payment: null,
    attendees: [
      { id: 12, name: '정해린', phone: '010-3344-8821', isGroupLeader: true, checkinStatus: 'NOT_CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: null },
      { id: 13, name: '김태리', phone: null, isGroupLeader: false, checkinStatus: 'NOT_CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: null },
    ],
    checkinLogs: [],
  },
  {
    id: 483,
    representativeName: '손예진',
    representativePhone: '010-7781-0093',
    exhibitionTitle: '2026 서울 스마트팩토리 박람회',
    ticketTypeName: '유료 입장',
    groupSize: 1,
    movementMode: 'INDIVIDUAL',
    status: 'CANCELLED',
    reservationSource: 'ONLINE',
    amount: 0,
    slotLabel: '07.15(화) 14:00',
    createdAt: '2026-07-06T13:30:00',
    payment: {
      pgProvider: '신용카드(취소)',
      pgTxId: '취소완료',
      amount: 0,
      feeAmount: 0,
      status: 'CANCELLED',
      paidAt: '2026-07-07T10:02:00',
    },
    attendees: [
      { id: 14, name: '손예진', phone: '010-7781-0093', isGroupLeader: true, checkinStatus: 'NOT_CHECKED_IN', attendeeStatus: 'CANCELLED', checkedInAt: null },
    ],
    checkinLogs: [],
  },
  {
    id: 484,
    representativeName: '조인성',
    representativePhone: '010-1129-5567',
    exhibitionTitle: '2026 서울 스마트팩토리 박람회',
    ticketTypeName: '유료 입장',
    groupSize: 3,
    movementMode: 'GROUP',
    status: 'PAID',
    reservationSource: 'ONSITE_MANUAL',
    amount: 90000,
    slotLabel: '07.16(수) 11:00',
    createdAt: '2026-07-09T08:47:00',
    payment: {
      pgProvider: 'ONSITE',
      pgTxId: 'ONSITE-20260709-001',
      amount: 90000,
      feeAmount: 0,
      status: 'PAID',
      paidAt: '2026-07-09T08:48:00',
    },
    attendees: [
      { id: 15, name: '조인성', phone: '010-1129-5567', isGroupLeader: true, checkinStatus: 'NOT_CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: null },
      { id: 16, name: '전도연', phone: null, isGroupLeader: false, checkinStatus: 'NOT_CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: null },
      { id: 17, name: '유연석', phone: null, isGroupLeader: false, checkinStatus: 'NOT_CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: null },
    ],
    checkinLogs: [],
  },
  {
    id: 485,
    representativeName: '한가인',
    representativePhone: '010-4456-7789',
    exhibitionTitle: '2026 서울 스마트팩토리 박람회',
    ticketTypeName: '유료 입장',
    groupSize: 2,
    movementMode: 'INDIVIDUAL',
    status: 'REFUNDED',
    reservationSource: 'ONLINE',
    amount: 0,
    slotLabel: '07.17(목) 09:00',
    createdAt: '2026-07-04T11:00:00',
    payment: {
      pgProvider: '신용카드(환불)',
      pgTxId: '환불완료',
      amount: 0,
      feeAmount: 0,
      status: 'REFUNDED',
      paidAt: '2026-07-10T15:00:00',
    },
    attendees: [
      { id: 18, name: '한가인', phone: '010-4456-7789', isGroupLeader: true, checkinStatus: 'NOT_CHECKED_IN', attendeeStatus: 'CANCELLED', checkedInAt: null },
      { id: 19, name: '유아인', phone: null, isGroupLeader: false, checkinStatus: 'NOT_CHECKED_IN', attendeeStatus: 'CANCELLED', checkedInAt: null },
    ],
    checkinLogs: [],
  },
  // 아래 두 건은 /admin/checkin/onsite-payment(현장 결제) 데모용 미결제(PENDING) 건이다.
  // 인원·티켓 단가가 달라 결제예정금액이 서로 다르다.
  {
    id: 486,
    representativeName: '강태오',
    representativePhone: '010-8823-1190',
    exhibitionTitle: '2026 서울 스마트팩토리 박람회',
    ticketTypeName: '유료 입장',
    groupSize: 1,
    movementMode: 'INDIVIDUAL',
    status: 'PENDING',
    reservationSource: 'ONLINE',
    amount: 30000,
    slotLabel: '07.18(금) 10:00',
    createdAt: '2026-07-11T09:30:00',
    payment: null,
    attendees: [
      { id: 20, name: '강태오', phone: '010-8823-1190', isGroupLeader: false, checkinStatus: 'NOT_CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: null },
    ],
    checkinLogs: [],
  },
  // GROUP 데모(§5.3 생성 규칙) — 대표 1행만 존재한다. 동행 인원은 reservation.group_size(4)로만
  // 집계되고(visit_log.head_count 산정 대상), reservation_attendee 행을 따로 만들지 않는다.
  {
    id: 487,
    representativeName: '임수아',
    representativePhone: '010-2290-6634',
    exhibitionTitle: '2026 서울 스마트팩토리 박람회',
    ticketTypeName: '유료 입장',
    groupSize: 4,
    movementMode: 'GROUP',
    status: 'PENDING',
    reservationSource: 'ONLINE',
    amount: 480000,
    slotLabel: '07.18(금) 13:00',
    createdAt: '2026-07-11T15:10:00',
    payment: null,
    attendees: [
      { id: 21, name: '임수아', phone: '010-2290-6634', isGroupLeader: true, checkinStatus: 'NOT_CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: null },
    ],
    checkinLogs: [],
  },
  // INDIVIDUAL 데모(§5.3) — 참석자 3명 중 2명만 체크인한 부분입장 상태. 전원 입장 전까지는
  // status가 CHECKED_IN으로 전이하지 않는다(id480 GROUP 부분입장과 동일 규칙, status=PAID 유지).
  {
    id: 488,
    representativeName: '오민석',
    representativePhone: '010-6620-3381',
    exhibitionTitle: '2026 서울 스마트팩토리 박람회',
    ticketTypeName: '유료 입장',
    groupSize: 3,
    movementMode: 'INDIVIDUAL',
    status: 'PAID',
    reservationSource: 'ONLINE',
    amount: 90000,
    slotLabel: '07.19(토) 10:00',
    createdAt: '2026-07-12T09:00:00',
    payment: {
      pgProvider: '신용카드(신한)',
      pgTxId: '88231045',
      amount: 90000,
      feeAmount: 2700,
      status: 'PAID',
      paidAt: '2026-07-12T09:01:00',
    },
    attendees: [
      { id: 22, name: '오민석', phone: '010-6620-3381', isGroupLeader: false, checkinStatus: 'CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: '2026-07-19T09:50:00' },
      { id: 23, name: '배수지', phone: null, isGroupLeader: false, checkinStatus: 'CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: '2026-07-19T09:52:00' },
      { id: 24, name: '천우희', phone: null, isGroupLeader: false, checkinStatus: 'NOT_CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: null },
    ],
    checkinLogs: [
      { id: 5, checkinMethod: 'QR_SELF', nameTagToken: 'e5f8c1d4-0488-4e55-9c00-ee0000000488', processedByName: CHECKIN_PROCESSOR_NAME, checkedInAt: '2026-07-19T09:50:00', memo: null },
      { id: 6, checkinMethod: 'QR_SELF', nameTagToken: 'e5f8c1d4-0489-4e55-9c00-ee0000000489', processedByName: CHECKIN_PROCESSOR_NAME, checkedInAt: '2026-07-19T09:52:00', memo: null },
    ],
  },
  // 부분취소 데모(§3.2.1) — INDIVIDUAL 예약에서 참석자 일부만 취소(attendee_status=CANCELLED)된
  // 상태. 예약 자체는 CANCELLED/REFUNDED로 전이하지 않고 PAID를 유지하며, 남은 참석자만 입장 대상이다.
  {
    id: 489,
    representativeName: '한소희',
    representativePhone: '010-7741-2290',
    exhibitionTitle: '2026 서울 스마트팩토리 박람회',
    ticketTypeName: '유료 입장',
    groupSize: 4,
    movementMode: 'INDIVIDUAL',
    status: 'PAID',
    reservationSource: 'ONLINE',
    amount: 120000,
    slotLabel: '07.20(일) 11:00',
    createdAt: '2026-07-13T11:20:00',
    payment: {
      pgProvider: '신용카드(우리)',
      pgTxId: '40221987',
      amount: 120000,
      feeAmount: 3600,
      status: 'PAID',
      paidAt: '2026-07-13T11:21:00',
    },
    attendees: [
      { id: 25, name: '한소희', phone: '010-7741-2290', isGroupLeader: false, checkinStatus: 'CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: '2026-07-20T10:55:00' },
      { id: 26, name: '이준기', phone: null, isGroupLeader: false, checkinStatus: 'NOT_CHECKED_IN', attendeeStatus: 'ACTIVE', checkedInAt: null },
      { id: 27, name: '정소민', phone: null, isGroupLeader: false, checkinStatus: 'NOT_CHECKED_IN', attendeeStatus: 'CANCELLED', checkedInAt: null },
      { id: 28, name: '류준열', phone: null, isGroupLeader: false, checkinStatus: 'NOT_CHECKED_IN', attendeeStatus: 'CANCELLED', checkedInAt: null },
    ],
    checkinLogs: [
      { id: 7, checkinMethod: 'QR_SELF', nameTagToken: 'e5f8c1d4-0490-4e55-9c00-ee0000000490', processedByName: CHECKIN_PROCESSOR_NAME, checkedInAt: '2026-07-20T10:55:00', memo: null },
    ],
  },
]

// mockDb 공유 checkin_log 레코드를 이 화면군의 로그 뷰로 변환한다. checked_in_by_user_id는
// 목 전체에서 단일 운영 계정(id=1)이므로 표시 이름도 CHECKIN_PROCESSOR_NAME으로 고정한다.
function toCheckinLogView(record: MockCheckinLogRecord): CheckinLogView {
  return {
    id: record.id,
    checkinMethod: record.checkinMethod,
    nameTagToken: record.nameTagToken,
    processedByName: CHECKIN_PROCESSOR_NAME,
    checkedInAt: record.checkedInAt,
    memo: record.memo,
  }
}

function getRuntimeCheckinLogViews(reservationId: number): CheckinLogView[] {
  return getRuntimeCheckinLogsByReservationId(reservationId).map(toCheckinLogView)
}

function toReservationAttendeeView(attendee: MockReservationAttendeeRecord): ReservationAttendeeView {
  return {
    id: attendee.id,
    name: attendee.name,
    phone: attendee.phone,
    isGroupLeader: attendee.isGroupLeader,
    checkinStatus: attendee.checkinStatus,
    attendeeStatus: attendee.attendeeStatus,
    checkedInAt: attendee.checkedInAt,
  }
}

function toReservationListItem(reservation: MockReservationRecord): ReservationListItem {
  const attendees = getMockReservationAttendees().filter((attendee) => attendee.reservationId === reservation.id && attendee.deletedAt === null)
  const representative = attendees.find((attendee) => attendee.isGroupLeader) ?? attendees[0]
  const payment = getMockPaymentByReservationId(reservation.id)

  return {
    id: reservation.id,
    representativeName: representative?.name ?? '-',
    representativePhone: representative?.phone ?? null,
    exhibitionTitle: reservation.exhibitionTitle,
    ticketTypeName: reservation.ticketTypeName,
    groupSize: reservation.groupSize,
    movementMode: reservation.movementMode,
    status: reservation.status,
    reservationSource: reservation.reservationSource,
    amount: payment?.amount ?? reservation.groupSize * reservation.unitPrice,
    slotLabel: reservation.slotLabel,
    createdAt: reservation.createdAt,
    payment: payment
      ? {
          pgProvider: payment.pgProvider,
          pgTxId: payment.pgTxId,
          amount: payment.amount,
          feeAmount: payment.feeAmount,
          status: payment.status,
          paidAt: payment.paidAt,
        }
      : null,
    attendees: attendees.map(toReservationAttendeeView),
    checkinLogs: getRuntimeCheckinLogViews(reservation.id),
  }
}

function getReservationItems(exhibitionId?: number): ReservationListItem[] {
  // 체크인 데모 대상(checkin.ts mockCheckinAttendees)이 시드 예약(480·481·484 등)을 가리키므로,
  // 런타임에 체크인하면 그 로그가 시드 예약 상세에도 이어 붙어야 한다.
  const seedReservations = (exhibitionId === undefined || exhibitionId === ADMIN_SEED_EXHIBITION_ID ? MOCK_RESERVATIONS : []).map(
    (item) => ({ ...item, checkinLogs: [...item.checkinLogs, ...getRuntimeCheckinLogViews(item.id)] }),
  )
  const sharedReservations = getMockReservations()
    .filter((reservation) => reservation.deletedAt === null)
    .filter((reservation) => exhibitionId === undefined || reservation.exhibitionId === exhibitionId)
    .map(toReservationListItem)

  return [...sharedReservations, ...seedReservations]
}

export async function getReservations(exhibitionId?: number): Promise<ReservationListItem[]> {
  return mockDelay(getReservationItems(exhibitionId))
}

export async function getReservationDetail(id: number, exhibitionId?: number): Promise<ReservationListItem | null> {
  return mockDelay(getReservationItems(exhibitionId).find((item) => item.id === id) ?? null)
}

// GET /api/exhibitions/{id}/reservations/export(§6.3)는 참석자(reservation_attendee) 단위로 추출한다.
// 예약 단위 필터(기간·status·movement_mode·ticket_type)는 reservation에 걸고, checkin_status는
// 참석자 행 자체에 거는 식으로 두 단계로 좁힌다.
export interface ReservationAttendeeExportFilters {
  fromDate: string | null
  toDate: string | null
  status: ReservationStatus | 'ALL'
  checkinStatus: CheckinStatus | 'ALL'
  movementMode: MovementMode | 'ALL'
  ticketTypeName: string | 'ALL'
}

export interface ReservationAttendeeExportRow {
  reservationId: number
  name: string
  phone: string | null
  isGroupLeader: boolean
  checkinStatus: CheckinStatus
  attendeeStatus: AttendeeStatus
  checkedInAt: string | null
  movementMode: MovementMode
  ticketTypeName: string
  status: ReservationStatus
  reservationSource: ReservationSource
  createdAt: string
}

function matchesExportFilters(reservation: ReservationListItem, filters: ReservationAttendeeExportFilters): boolean {
  if (filters.status !== 'ALL' && reservation.status !== filters.status) return false
  if (filters.movementMode !== 'ALL' && reservation.movementMode !== filters.movementMode) return false
  if (filters.ticketTypeName !== 'ALL' && reservation.ticketTypeName !== filters.ticketTypeName) return false
  const createdDate = reservation.createdAt.slice(0, 10)
  if (filters.fromDate && createdDate < filters.fromDate) return false
  if (filters.toDate && createdDate > filters.toDate) return false
  return true
}

export async function getReservationAttendeeExportRows(
  exhibitionId: number,
  filters: ReservationAttendeeExportFilters,
): Promise<ReservationAttendeeExportRow[]> {
  const rows = getReservationItems(exhibitionId).filter((reservation) => matchesExportFilters(reservation, filters)).flatMap((reservation) =>
    reservation.attendees
      .filter((attendee) => filters.checkinStatus === 'ALL' || attendee.checkinStatus === filters.checkinStatus)
      .map((attendee) => ({
        reservationId: reservation.id,
        name: attendee.name,
        phone: attendee.phone,
        isGroupLeader: attendee.isGroupLeader,
        checkinStatus: attendee.checkinStatus,
        attendeeStatus: attendee.attendeeStatus,
        checkedInAt: attendee.checkedInAt,
        movementMode: reservation.movementMode,
        ticketTypeName: reservation.ticketTypeName,
        status: reservation.status,
        reservationSource: reservation.reservationSource,
        createdAt: reservation.createdAt,
      })),
  )

  return mockDelay(rows)
}

export interface ReservationAttendeeExportResult {
  fileName: string
  rowCount: number
}

// 실제 xlsx 파일 생성·응답은 백엔드 GET /api/exhibitions/{id}/reservations/export(§6.3)의 몫이다.
// 백엔드 연동 전까지는 같은 필터로 행 수만 다시 집계해 성공 결과를 흉내낸다 — 엔드포인트가 생기면
// 이 함수 본문을 실제 파일 다운로드(blob 응답) 처리로 교체한다.
export async function exportReservationAttendees(
  // 실제 백엔드는 /api/exhibitions/{id}/reservations/export 경로에서 같은 필터를 적용한다.
  exhibitionId: number,
  filters: ReservationAttendeeExportFilters,
): Promise<ReservationAttendeeExportResult> {
  const rows = await getReservationAttendeeExportRows(exhibitionId, filters)
  const fileName = `참석자명단_${new Date().toISOString().slice(0, 10)}.xlsx`

  return mockDelay({ fileName, rowCount: rows.length })
}

// POST /api/checkin/onsite-payment의 목 구현(§5.3 payment, pg_provider=ONSITE). 현장 데스크 결제라
// PG 콜백처럼 실패를 시뮬레이션하지 않고 항상 성공으로 기록한다. reservation.status는 PENDING→PAID로
// 전이하고, pg_tx_id는 내부 영수번호를 흉내낸다.
