import type { CheckinMethod, CheckinStatus, MovementMode } from '../../types'
import { mockDelay } from './mockClient'
import {
  checkInReservationAttendeeRecord,
  createOnsitePaymentForReservation,
  createWalkInReservationRecord,
  getMockReservationAttendees,
  getMockReservations,
} from './mockDb'
import { findActiveIssuedNameTagForAttendee, findNameTagByToken, markNameTagIssued, markNameTagRevoked } from './nameTags'

export interface RecentCheckinView {
  id: number
  attendeeName: string
  groupSize: number
  movementMode: MovementMode
  checkinMethod: CheckinMethod
  minutesAgo: number
}

const MOCK_RECENT_CHECKINS: RecentCheckinView[] = [
  { id: 1, attendeeName: '김방문', groupSize: 3, movementMode: 'GROUP', checkinMethod: 'QR_SELF', minutesAgo: 0 },
  { id: 2, attendeeName: '이참석', groupSize: 1, movementMode: 'INDIVIDUAL', checkinMethod: 'QR_SELF', minutesAgo: 1 },
  { id: 3, attendeeName: '최게스트', groupSize: 2, movementMode: 'GROUP', checkinMethod: 'MANUAL_SEARCH', minutesAgo: 3 },
  { id: 4, attendeeName: '한방문', groupSize: 1, movementMode: 'INDIVIDUAL', checkinMethod: 'QR_SELF', minutesAgo: 5 },
  { id: 5, attendeeName: '윤참가', groupSize: 4, movementMode: 'GROUP', checkinMethod: 'WALK_IN', minutesAgo: 7 },
]

export async function getRecentCheckins(exhibitionId?: number): Promise<RecentCheckinView[]> {
  return mockDelay(exhibitionId === undefined || exhibitionId === 1 ? MOCK_RECENT_CHECKINS : [])
}

// 입구 바인딩(§3.3 2-스캔)이 참조하는 attendee 디렉터리. exhibitionId/이름은 lib/api/reservations.ts와
// 동일 attendee id 공간을 재사용해 /admin/nametags 재고 화면과 이름이 어긋나지 않게 한다.
interface MockCheckinAttendee {
  attendeeId: number
  exhibitionId: number
  reservationId: number
  name: string
  phone: string
  ticketQrToken: string | null
  isGroupLeader: boolean
  movementMode: MovementMode
  groupSize: number
  checkinStatus: CheckinStatus
  checkedInAt?: string | null
}

let mockCheckinAttendees: MockCheckinAttendee[] = [
  // INDIVIDUAL, 미체크인 — 정상 1차 바인딩(GATE ENTRY) 데모.
  { attendeeId: 4, exhibitionId: 1, reservationId: 480, name: '최민지', phone: '010-2222-0004', ticketQrToken: 'TICKET-QR-004', isGroupLeader: false, movementMode: 'INDIVIDUAL', groupSize: 1, checkinStatus: 'NOT_CHECKED_IN' },
  // GROUP 대표, 이미 체크인 + nameTags.ts에 ISSUED 태그(id=15) 보유 — 분실/교환 재바인딩(REISSUE) 데모.
  { attendeeId: 6, exhibitionId: 1, reservationId: 481, name: '박상우', phone: '010-9920-4471', ticketQrToken: 'TICKET-QR-006', isGroupLeader: true, movementMode: 'GROUP', groupSize: 6, checkinStatus: 'CHECKED_IN' },
  // GROUP 대표, 미체크인 — head_count 안내 + 1차 바인딩 데모.
  { attendeeId: 15, exhibitionId: 1, reservationId: 484, name: '조인성', phone: '010-1129-5567', ticketQrToken: 'TICKET-QR-015', isGroupLeader: true, movementMode: 'GROUP', groupSize: 3, checkinStatus: 'NOT_CHECKED_IN' },
  // GROUP 비대표 — ticket_qr_token이 없다(§5.3: GROUP은 대표만 발급). 토큰이 없어 QR 검증 자체가 불가하지만,
  // 수기 조회(이름/전화/예약번호)로는 찾을 수 있다.
  { attendeeId: 16, exhibitionId: 1, reservationId: 484, name: '전도연', phone: '010-9999-0016', ticketQrToken: null, isGroupLeader: false, movementMode: 'GROUP', groupSize: 3, checkinStatus: 'NOT_CHECKED_IN' },
  // INDIVIDUAL, 미체크인 — 추가 일반 데모.
  { attendeeId: 9, exhibitionId: 1, reservationId: 481, name: '윤아름', phone: '010-7777-0009', ticketQrToken: 'TICKET-QR-009', isGroupLeader: false, movementMode: 'INDIVIDUAL', groupSize: 1, checkinStatus: 'NOT_CHECKED_IN' },
  // 동명이인(§ 수기 조회 데모) — 이름만으로는 구분되지 않고, 전화번호 뒷자리(7733 vs 9012)로만 구분된다.
  { attendeeId: 20, exhibitionId: 1, reservationId: 490, name: '김민준', phone: '010-4821-7733', ticketQrToken: 'TICKET-QR-020', isGroupLeader: false, movementMode: 'INDIVIDUAL', groupSize: 1, checkinStatus: 'NOT_CHECKED_IN' },
  { attendeeId: 21, exhibitionId: 1, reservationId: 491, name: '김민준', phone: '010-4821-9012', ticketQrToken: 'TICKET-QR-021', isGroupLeader: false, movementMode: 'INDIVIDUAL', groupSize: 1, checkinStatus: 'NOT_CHECKED_IN' },
]

function getSharedMockDbCheckinAttendees(): MockCheckinAttendee[] {
  const reservationsById = new Map(getMockReservations().map((reservation) => [reservation.id, reservation]))

  return getMockReservationAttendees()
    .filter((attendee) => attendee.deletedAt === null)
    .flatMap((attendee) => {
      const reservation = reservationsById.get(attendee.reservationId)
      if (!reservation || reservation.deletedAt !== null) return []

      return [
        {
          attendeeId: attendee.id,
          exhibitionId: attendee.exhibitionId,
          reservationId: attendee.reservationId,
          name: attendee.name,
          phone: attendee.phone ?? '',
          ticketQrToken: attendee.ticketQrToken,
          isGroupLeader: attendee.isGroupLeader,
          movementMode: reservation.movementMode,
          groupSize: reservation.groupSize,
          checkinStatus: attendee.checkinStatus,
        },
      ]
    })
}

function getCheckinAttendees(exhibitionId?: number): MockCheckinAttendee[] {
  const attendees = [...mockCheckinAttendees, ...getSharedMockDbCheckinAttendees()]
  return exhibitionId === undefined ? attendees : attendees.filter((attendee) => attendee.exhibitionId === exhibitionId)
}

function findCheckinAttendeeById(attendeeId: number, reservationId?: number, exhibitionId?: number): MockCheckinAttendee | undefined {
  return getCheckinAttendees(exhibitionId).find(
    (attendee) => attendee.attendeeId === attendeeId && (reservationId === undefined || attendee.reservationId === reservationId),
  )
}

export interface TicketVerifyResult {
  attendeeId: number
  reservationId: number
  name: string
  phone: string
  movementMode: MovementMode
  groupSize: number
  isGroupLeader: boolean
  checkinStatus: CheckinStatus
  hasActiveNameTag: boolean
}

// POST /api/checkin/nametag의 1단계(모바일 티켓 QR 검증)에 해당하는 목 구현(§3.3, §6.4).
export async function verifyTicketQr(token: string, exhibitionId?: number): Promise<TicketVerifyResult | null> {
  const attendee = getCheckinAttendees(exhibitionId).find((item) => item.ticketQrToken === token)
  if (!attendee) return mockDelay(null)

  const activeTag = await findActiveIssuedNameTagForAttendee(attendee.attendeeId, attendee.exhibitionId)

  return mockDelay({
    attendeeId: attendee.attendeeId,
    reservationId: attendee.reservationId,
    name: attendee.name,
    phone: attendee.phone,
    movementMode: attendee.movementMode,
    groupSize: attendee.groupSize,
    isGroupLeader: attendee.isGroupLeader,
    checkinStatus: attendee.checkinStatus,
    hasActiveNameTag: activeTag !== null,
  })
}

export interface AttendeeSearchQuery {
  name?: string
  phone?: string
  reservationCode?: string
}

export interface AttendeeSearchCandidate {
  attendeeId: number
  reservationId: number
  name: string
  phone: string
  reservationCode: string
  movementMode: MovementMode
  groupSize: number
  isGroupLeader: boolean
  checkinStatus: CheckinStatus
  hasActiveNameTag: boolean
}

// /admin/checkin/manual의 1단계(이름/전화/예약번호 조회)에 해당하는 목 구현(§5.3 reservation·
// reservation_attendee의 name/phone 기준). 조건은 입력된 필드끼리 AND로 좁혀진다 — 동명이인은
// 전화 뒷자리나 예약번호로 구분한다.
export async function searchAttendees(query: AttendeeSearchQuery, exhibitionId?: number): Promise<AttendeeSearchCandidate[]> {
  const name = query.name?.trim().toLowerCase()
  const phoneDigits = query.phone?.replace(/[^0-9]/g, '')
  const reservationCode = query.reservationCode?.trim().toLowerCase()

  if (!name && !phoneDigits && !reservationCode) return mockDelay([])

  const matches = getCheckinAttendees(exhibitionId).filter((attendee) => {
    if (name && !attendee.name.toLowerCase().includes(name)) return false
    if (phoneDigits && !attendee.phone.replace(/[^0-9]/g, '').includes(phoneDigits)) return false
    if (reservationCode && !`r-${attendee.reservationId}`.includes(reservationCode)) return false
    return true
  })

  const candidates = await Promise.all(
    matches.map(async (attendee) => ({
      attendeeId: attendee.attendeeId,
      reservationId: attendee.reservationId,
      name: attendee.name,
      phone: attendee.phone,
      reservationCode: `R-${attendee.reservationId}`,
      movementMode: attendee.movementMode,
      groupSize: attendee.groupSize,
      isGroupLeader: attendee.isGroupLeader,
      checkinStatus: attendee.checkinStatus,
      hasActiveNameTag: (await findActiveIssuedNameTagForAttendee(attendee.attendeeId, attendee.exhibitionId)) !== null,
    })),
  )

  return mockDelay(candidates)
}

export interface WalkInInput {
  name: string
  phone: string
  groupSize: number
  movementMode: MovementMode
  ticketTypeId: number
}

export interface WalkInAttendeeSummary {
  attendeeId: number
  name: string
  isGroupLeader: boolean
}

export interface WalkInResult {
  reservationId: number
  attendees: WalkInAttendeeSummary[]
  // 이 화면에서 곧바로 네임태그를 바인딩할 대상 — GROUP은 대표, INDIVIDUAL은 등록자 본인(첫 행).
  primaryAttendeeId: number
}

// POST /api/checkin/walk-in의 1·2단계(§3.x 워크인 플로우 C-1~3)에 해당하는 목 구현.
// reservation_source=ONSITE_MANUAL로 예약을 만들고, §5.3 GROUP/INDIVIDUAL 생성 규칙을 그대로 따른다:
// GROUP은 대표 1행만 생성하고(명단행은 이 화면에서 받지 않는다), INDIVIDUAL은 group_size만큼 N행을
// 생성한다(등록자 본인 외 동행은 실명을 받지 않으므로 "동행 N"으로 구분한다).
export async function createWalkInReservation(exhibitionId: number, input: WalkInInput): Promise<WalkInResult> {
  const { reservation, attendees: createdAttendees } = createWalkInReservationRecord({
    exhibitionId,
    ticketTypeId: input.ticketTypeId,
    movementMode: input.movementMode,
    groupSize: input.groupSize,
    name: input.name,
    phone: input.phone,
  })
  const attendees = createdAttendees.map((attendee) => ({
    attendeeId: attendee.id,
    name: attendee.name,
    isGroupLeader: attendee.isGroupLeader,
  }))

  return mockDelay({ reservationId: reservation.id, attendees, primaryAttendeeId: attendees[0].attendeeId })
  /*

  if (input.movementMode === 'GROUP') {
    const attendeeId = nextWalkInAttendeeId++
    mockCheckinAttendees = [
      ...mockCheckinAttendees,
      {
        attendeeId,
        exhibitionId,
        reservationId,
        name: input.name,
        phone: input.phone,
        ticketQrToken: null,
        isGroupLeader: true,
        movementMode: 'GROUP',
        groupSize: input.groupSize,
        checkinStatus: 'NOT_CHECKED_IN',
      },
    ]
    attendees.push({ attendeeId, name: input.name, isGroupLeader: true })
  } else {
    for (let index = 0; index < input.groupSize; index += 1) {
      const attendeeId = nextWalkInAttendeeId++
      const name = index === 0 ? input.name : `${input.name} 동행 ${index}`
      mockCheckinAttendees = [
        ...mockCheckinAttendees,
        {
          attendeeId,
          exhibitionId,
          reservationId,
          name,
          phone: input.phone,
          ticketQrToken: null,
          isGroupLeader: false,
          movementMode: 'INDIVIDUAL',
          groupSize: 1,
          checkinStatus: 'NOT_CHECKED_IN',
        },
      ]
      attendees.push({ attendeeId, name, isGroupLeader: false })
    }
  }

  */
}

export interface OnsitePaymentResult {
  amount: number
  paidAt: string
  pgTxId: string
}

// POST /api/checkin/onsite-payment의 목 구현(§3.x 워크인 플로우 C-4 앞부분). 현장 데스크에서 직접
// 확인하는 결제라 PG 콜백처럼 실패를 시뮬레이션하지 않고 항상 성공으로 기록한다.
export async function recordOnsitePayment(reservationId: number, amount: number): Promise<OnsitePaymentResult> {
  const payment = createOnsitePaymentForReservation(reservationId, amount)
  return mockDelay({
    amount: payment.amount,
    paidAt: payment.paidAt ?? new Date().toISOString(),
    pgTxId: payment.pgTxId,
  })
}

export interface CheckinLogView {
  id: number
  attendeeId: number
  attendeeName: string
  nameTagId: number | null
  checkinMethod: CheckinMethod
  checkedInAt: string
  memo: string | null
}

let mockCheckinLogs: CheckinLogView[] = [
  { id: 1, attendeeId: 1, attendeeName: '김도현', nameTagId: 13, checkinMethod: 'QR_SELF', checkedInAt: '2026-07-14T09:55:00', memo: null },
  { id: 2, attendeeId: 6, attendeeName: '박상우', nameTagId: 15, checkinMethod: 'QR_SELF', checkedInAt: '2026-07-14T12:52:00', memo: null },
]
let nextCheckinLogId = 3

function appendCheckinLog(input: {
  attendeeId: number
  attendeeName: string
  nameTagId: number | null
  checkinMethod: CheckinMethod
  memo: string | null
}): CheckinLogView {
  const log: CheckinLogView = {
    id: nextCheckinLogId++,
    attendeeId: input.attendeeId,
    attendeeName: input.attendeeName,
    nameTagId: input.nameTagId,
    checkinMethod: input.checkinMethod,
    checkedInAt: new Date().toISOString(),
    memo: input.memo,
  }
  mockCheckinLogs = [log, ...mockCheckinLogs]
  return log
}

export async function getCheckinLogs(limit = 10, exhibitionId?: number): Promise<CheckinLogView[]> {
  const logs =
    exhibitionId === undefined
      ? mockCheckinLogs
      : mockCheckinLogs.filter((log) => findCheckinAttendeeById(log.attendeeId, undefined, exhibitionId)?.exhibitionId === exhibitionId)
  return mockDelay(logs.slice(0, limit))
}

export type BindNameTagErrorCode = 'TAG_NOT_FOUND' | 'TAG_REVOKED' | 'TAG_ISSUED_TO_OTHER'

export interface BindNameTagSuccess {
  ok: true
  checkinMethod: CheckinMethod
  gateEntryRecorded: boolean
  log: CheckinLogView
}

export interface BindNameTagFailure {
  ok: false
  errorCode: BindNameTagErrorCode
  message: string
}

export type BindNameTagResult = BindNameTagSuccess | BindNameTagFailure

const CURRENT_STAFF_USER_ID = 1

export interface BindNameTagOptions {
  // 첫 바인딩일 때 기록할 checkin_method. QR 체크인=QR_SELF(기본), 수기 체크인=MANUAL_SEARCH.
  // 재바인딩(REISSUE)이면 이 값과 무관하게 항상 REISSUE로 기록한다.
  checkinMethod?: CheckinMethod
  // 수기 체크인 등에서 운영자가 직접 남기는 사유. 시스템이 남기는 자동 메모(재바인딩/멱등 처리 안내)와는
  // 합쳐서 기록한다.
  memo?: string | null
  reservationId?: number
  exhibitionId?: number
}

function combineMemo(autoNote: string | null, manualMemo?: string | null): string | null {
  const parts = [manualMemo?.trim(), autoNote].filter((part): part is string => Boolean(part))
  return parts.length > 0 ? parts.join(' · ') : null
}

// POST /api/checkin/nametag의 2단계(물리 네임태그 바인딩)에 해당하는 목 구현(§3.3, §6.4).
// QR 체크인·수기 체크인 모두 이 함수를 공유한다(첫 바인딩 시 checkin_method만 다르다).
// - 태그가 AVAILABLE이 아니면 거부한다(REVOKED·다른 attendee에게 ISSUED).
// - 같은 attendee에게 이미 바인딩된 태그를 다시 스캔하면 멱등 처리한다.
// - attendee가 이미 CHECKED_IN 상태에서 새 AVAILABLE 태그를 바인딩하면 기존 ISSUED 태그를 자동
//   REVOKED 처리하고 REISSUE로 기록한다(GATE ENTRY 없음). 그 외에는 첫 바인딩으로 GATE ENTRY를 기록한다.
function markAttendeeCheckedIn(attendeeId: number, reservationId?: number, checkedInAt = new Date().toISOString()) {
  mockCheckinAttendees = mockCheckinAttendees.map((item) =>
    item.attendeeId === attendeeId && (reservationId === undefined || item.reservationId === reservationId)
      ? { ...item, checkinStatus: 'CHECKED_IN', checkedInAt }
      : item,
  )

  if (reservationId !== undefined) {
    checkInReservationAttendeeRecord(attendeeId, reservationId, checkedInAt)
  }
}

export async function bindNameTag(attendeeId: number, nameTagToken: string, options: BindNameTagOptions = {}): Promise<BindNameTagResult> {
  const attendee = findCheckinAttendeeById(attendeeId, options.reservationId, options.exhibitionId)
  const tag = await findNameTagByToken(nameTagToken, options.exhibitionId ?? attendee?.exhibitionId)
  const firstBindMethod = options.checkinMethod ?? 'QR_SELF'

  if (!attendee) {
    return mockDelay({ ok: false, errorCode: 'TAG_NOT_FOUND', message: '李몄꽍?먮? 李얠쓣 ???놁뒿?덈떎.' })
  }
  if (!tag) {
    return mockDelay({ ok: false, errorCode: 'TAG_NOT_FOUND', message: '유효하지 않은 네임태그 QR입니다.' })
  }
  if (tag.status === 'REVOKED') {
    return mockDelay({ ok: false, errorCode: 'TAG_REVOKED', message: '회수(REVOKED)된 네임태그입니다. 다른 태그를 사용해주세요.' })
  }
  if (tag.status === 'ISSUED' && tag.attendeeId !== attendeeId) {
    return mockDelay({ ok: false, errorCode: 'TAG_ISSUED_TO_OTHER', message: '이미 다른 참석자에게 발급된 네임태그입니다.' })
  }

  const attendeeName = attendee.name

  // 같은 attendee에게 이미 바인딩된 태그를 다시 스캔 — 멱등 처리(§6.4 바인딩 가드).
  if (tag.status === 'ISSUED' && tag.attendeeId === attendeeId) {
    const checkedInAt = new Date().toISOString()
    markAttendeeCheckedIn(attendeeId, options.reservationId, checkedInAt)
    const log = appendCheckinLog({
      attendeeId,
      attendeeName,
      nameTagId: tag.id,
      checkinMethod: firstBindMethod,
      memo: combineMemo('이미 바인딩된 태그 재스캔 — 멱등 처리', options.memo),
    })
    return mockDelay({ ok: true, checkinMethod: firstBindMethod, gateEntryRecorded: false, log })
  }

  const existingActiveTag = await findActiveIssuedNameTagForAttendee(attendeeId, options.exhibitionId ?? attendee.exhibitionId)
  const isReissue = existingActiveTag !== null

  if (isReissue && existingActiveTag) {
    await markNameTagRevoked(existingActiveTag.id)
  }
  const boundTag = await markNameTagIssued(tag.id, attendeeId, CURRENT_STAFF_USER_ID)

  if (!isReissue) {
    markAttendeeCheckedIn(attendeeId, options.reservationId)
  }

  const checkinMethod = isReissue ? 'REISSUE' : firstBindMethod
  const log = appendCheckinLog({
    attendeeId,
    attendeeName,
    nameTagId: boundTag.id,
    checkinMethod,
    memo: combineMemo(isReissue ? '분실/교환으로 인한 재바인딩 — 이전 태그 REVOKED' : null, options.memo),
  })

  return mockDelay({
    ok: true,
    checkinMethod,
    gateEntryRecorded: !isReissue,
    log,
  })
}
