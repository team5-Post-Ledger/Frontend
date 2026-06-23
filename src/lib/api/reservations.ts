import type { CheckinMethod, CheckinStatus, MovementMode, PgProvider, ReservationSource, ReservationStatus } from '../../types'
import { mockDelay } from './mockClient'

export interface ReservationAttendeeView {
  id: number
  name: string
  phone: string | null
  isGroupLeader: boolean
  checkinStatus: CheckinStatus
}

export interface CheckinLogView {
  id: number
  checkinMethod: CheckinMethod
  checkedInAt: string
  memo: string | null
}

export interface ReservationPaymentView {
  pgProvider: PgProvider
  pgTxId: string
  paidAt: string | null
  feeAmount: number
}

export interface ReservationListItem {
  id: number
  representativeName: string
  representativePhone: string | null
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

const MOCK_RESERVATIONS: ReservationListItem[] = [
  {
    id: 479,
    representativeName: '김도현',
    representativePhone: '010-2841-3920',
    groupSize: 1,
    movementMode: 'INDIVIDUAL',
    status: 'CHECKED_IN',
    reservationSource: 'ONLINE',
    amount: 30000,
    slotLabel: '07.14(월) 10:00',
    createdAt: '2026-07-02T14:21:00',
    payment: { pgProvider: '신용카드(국민)', pgTxId: '30482914', paidAt: '2026-07-02T14:21:00', feeAmount: 900 },
    attendees: [{ id: 1, name: '김도현', phone: '010-2841-3920', isGroupLeader: true, checkinStatus: 'CHECKED_IN' }],
    checkinLogs: [{ id: 1, checkinMethod: 'QR_SELF', checkedInAt: '2026-07-14T09:58:00', memo: 'A홀 입구 · 단말 #02' }],
  },
  {
    id: 480,
    representativeName: '이서연',
    representativePhone: '010-5532-1147',
    groupSize: 4,
    movementMode: 'GROUP',
    status: 'PAID',
    reservationSource: 'ONLINE',
    amount: 120000,
    slotLabel: '07.14(월) 11:00',
    createdAt: '2026-07-03T09:05:00',
    payment: { pgProvider: '법인카드', pgTxId: '77120934', paidAt: '2026-07-03T09:06:00', feeAmount: 3600 },
    attendees: [
      { id: 2, name: '이서연', phone: '010-5532-1147', isGroupLeader: true, checkinStatus: 'CHECKED_IN' },
      { id: 3, name: '박준호', phone: null, isGroupLeader: false, checkinStatus: 'CHECKED_IN' },
      { id: 4, name: '최민지', phone: null, isGroupLeader: false, checkinStatus: 'NOT_CHECKED_IN' },
      { id: 5, name: '정우성', phone: null, isGroupLeader: false, checkinStatus: 'NOT_CHECKED_IN' },
    ],
    checkinLogs: [{ id: 2, checkinMethod: 'QR_SELF', checkedInAt: '2026-07-14T10:42:00', memo: 'A홀 입구 · 단말 #01 (2명)' }],
  },
  {
    id: 481,
    representativeName: '박상우',
    representativePhone: '010-9920-4471',
    groupSize: 6,
    movementMode: 'GROUP',
    status: 'CHECKED_IN',
    reservationSource: 'ONLINE',
    amount: 180000,
    slotLabel: '07.14(월) 13:00',
    createdAt: '2026-07-01T16:40:00',
    payment: { pgProvider: '세금계산서(계좌이체)', pgTxId: 'TX-4471-0029', paidAt: '2026-07-05T11:20:00', feeAmount: 0 },
    attendees: [
      { id: 6, name: '박상우', phone: '010-9920-4471', isGroupLeader: true, checkinStatus: 'CHECKED_IN' },
      { id: 7, name: '한지민', phone: null, isGroupLeader: false, checkinStatus: 'CHECKED_IN' },
      { id: 8, name: '오세훈', phone: null, isGroupLeader: false, checkinStatus: 'CHECKED_IN' },
      { id: 9, name: '윤아름', phone: null, isGroupLeader: false, checkinStatus: 'CHECKED_IN' },
      { id: 10, name: '강동원', phone: null, isGroupLeader: false, checkinStatus: 'CHECKED_IN' },
      { id: 11, name: '서지혜', phone: null, isGroupLeader: false, checkinStatus: 'CHECKED_IN' },
    ],
    checkinLogs: [
      { id: 3, checkinMethod: 'QR_SELF', checkedInAt: '2026-07-14T12:55:00', memo: 'A홀 단체입구 · 단말 #04 (6명)' },
      { id: 4, checkinMethod: 'ONSITE_MANUAL', checkedInAt: '2026-07-14T12:50:00', memo: '네임태그 일괄 발급 · 운영데스크' },
    ],
  },
  {
    id: 482,
    representativeName: '정해린',
    representativePhone: '010-3344-8821',
    groupSize: 2,
    movementMode: 'GROUP',
    status: 'PENDING',
    reservationSource: 'ONLINE',
    amount: 60000,
    slotLabel: '07.15(화) 10:00',
    createdAt: '2026-07-08T20:11:00',
    payment: null,
    attendees: [
      { id: 12, name: '정해린', phone: '010-3344-8821', isGroupLeader: true, checkinStatus: 'NOT_CHECKED_IN' },
      { id: 13, name: '김태리', phone: null, isGroupLeader: false, checkinStatus: 'NOT_CHECKED_IN' },
    ],
    checkinLogs: [],
  },
  {
    id: 483,
    representativeName: '손예진',
    representativePhone: '010-7781-0093',
    groupSize: 1,
    movementMode: 'INDIVIDUAL',
    status: 'CANCELLED',
    reservationSource: 'ONLINE',
    amount: 0,
    slotLabel: '07.15(화) 14:00',
    createdAt: '2026-07-06T13:30:00',
    payment: { pgProvider: '신용카드(취소)', pgTxId: '취소완료', paidAt: '2026-07-07T10:02:00', feeAmount: 0 },
    attendees: [{ id: 14, name: '손예진', phone: '010-7781-0093', isGroupLeader: true, checkinStatus: 'NOT_CHECKED_IN' }],
    checkinLogs: [],
  },
  {
    id: 484,
    representativeName: '조인성',
    representativePhone: '010-1129-5567',
    groupSize: 3,
    movementMode: 'GROUP',
    status: 'PAID',
    reservationSource: 'ONSITE_MANUAL',
    amount: 90000,
    slotLabel: '07.16(수) 11:00',
    createdAt: '2026-07-09T08:47:00',
    payment: { pgProvider: 'ONSITE', pgTxId: 'ONSITE-20260709-001', paidAt: '2026-07-09T08:48:00', feeAmount: 0 },
    attendees: [
      { id: 15, name: '조인성', phone: '010-1129-5567', isGroupLeader: true, checkinStatus: 'NOT_CHECKED_IN' },
      { id: 16, name: '전도연', phone: null, isGroupLeader: false, checkinStatus: 'NOT_CHECKED_IN' },
      { id: 17, name: '유연석', phone: null, isGroupLeader: false, checkinStatus: 'NOT_CHECKED_IN' },
    ],
    checkinLogs: [],
  },
  {
    id: 485,
    representativeName: '한가인',
    representativePhone: '010-4456-7789',
    groupSize: 2,
    movementMode: 'INDIVIDUAL',
    status: 'REFUNDED',
    reservationSource: 'ONLINE',
    amount: 0,
    slotLabel: '07.17(목) 09:00',
    createdAt: '2026-07-04T11:00:00',
    payment: { pgProvider: '신용카드(환불)', pgTxId: '환불완료', paidAt: '2026-07-10T15:00:00', feeAmount: 0 },
    attendees: [
      { id: 18, name: '한가인', phone: '010-4456-7789', isGroupLeader: true, checkinStatus: 'NOT_CHECKED_IN' },
      { id: 19, name: '유아인', phone: null, isGroupLeader: false, checkinStatus: 'NOT_CHECKED_IN' },
    ],
    checkinLogs: [],
  },
]

export async function getReservations(): Promise<ReservationListItem[]> {
  return mockDelay(MOCK_RESERVATIONS)
}
