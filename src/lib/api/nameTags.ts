import type { NameTag, NameTagStatus } from '../../types'
import { mockDelay } from './mockClient'
import { getReservations } from './reservations'

let mockNameTags: NameTag[] = [
  // AVAILABLE — 사전 인쇄 풀(시나리오 A). attendee 미연결.
  { id: 1, exhibitionId: 1, attendeeId: null, token: 'a1c4e7f0-0001-4a11-9c00-aa0000000001', status: 'AVAILABLE', issuedByUserId: null, issuedAt: null },
  { id: 2, exhibitionId: 1, attendeeId: null, token: 'a1c4e7f0-0002-4a11-9c00-aa0000000002', status: 'AVAILABLE', issuedByUserId: null, issuedAt: null },
  { id: 3, exhibitionId: 1, attendeeId: null, token: 'a1c4e7f0-0003-4a11-9c00-aa0000000003', status: 'AVAILABLE', issuedByUserId: null, issuedAt: null },
  { id: 4, exhibitionId: 1, attendeeId: null, token: 'a1c4e7f0-0004-4a11-9c00-aa0000000004', status: 'AVAILABLE', issuedByUserId: null, issuedAt: null },
  { id: 5, exhibitionId: 1, attendeeId: null, token: 'a1c4e7f0-0005-4a11-9c00-aa0000000005', status: 'AVAILABLE', issuedByUserId: null, issuedAt: null },
  { id: 6, exhibitionId: 1, attendeeId: null, token: 'a1c4e7f0-0006-4a11-9c00-aa0000000006', status: 'AVAILABLE', issuedByUserId: null, issuedAt: null },
  { id: 7, exhibitionId: 1, attendeeId: null, token: 'a1c4e7f0-0007-4a11-9c00-aa0000000007', status: 'AVAILABLE', issuedByUserId: null, issuedAt: null },
  { id: 8, exhibitionId: 1, attendeeId: null, token: 'a1c4e7f0-0008-4a11-9c00-aa0000000008', status: 'AVAILABLE', issuedByUserId: null, issuedAt: null },
  { id: 9, exhibitionId: 1, attendeeId: null, token: 'a1c4e7f0-0009-4a11-9c00-aa0000000009', status: 'AVAILABLE', issuedByUserId: null, issuedAt: null },
  { id: 10, exhibitionId: 1, attendeeId: null, token: 'a1c4e7f0-0010-4a11-9c00-aa0000000010', status: 'AVAILABLE', issuedByUserId: null, issuedAt: null },
  { id: 11, exhibitionId: 1, attendeeId: null, token: 'a1c4e7f0-0011-4a11-9c00-aa0000000011', status: 'AVAILABLE', issuedByUserId: null, issuedAt: null },
  { id: 12, exhibitionId: 1, attendeeId: null, token: 'a1c4e7f0-0012-4a11-9c00-aa0000000012', status: 'AVAILABLE', issuedByUserId: null, issuedAt: null },
  // ISSUED — attendee 바인딩됨(§3.3 2-스캔 결과). attendeeId는 lib/api/reservations.ts의 attendee id를 재사용한다.
  { id: 13, exhibitionId: 1, attendeeId: 1, token: 'b2d5f8a1-0013-4b22-9c00-bb0000000013', status: 'ISSUED', issuedByUserId: 1, issuedAt: '2026-07-14T09:55:00' },
  { id: 14, exhibitionId: 1, attendeeId: 2, token: 'b2d5f8a1-0014-4b22-9c00-bb0000000014', status: 'ISSUED', issuedByUserId: 1, issuedAt: '2026-07-14T10:40:00' },
  { id: 15, exhibitionId: 1, attendeeId: 6, token: 'b2d5f8a1-0015-4b22-9c00-bb0000000015', status: 'ISSUED', issuedByUserId: 1, issuedAt: '2026-07-14T12:52:00' },
  { id: 16, exhibitionId: 1, attendeeId: 7, token: 'b2d5f8a1-0016-4b22-9c00-bb0000000016', status: 'ISSUED', issuedByUserId: 1, issuedAt: '2026-07-14T12:53:00' },
  // REVOKED — 분실/교환으로 재바인딩되어 이력만 남은 태그(§3.3 재바인딩). attendeeId 1·2는 현재
  // ISSUED(id 13·14)로 새 태그를 갖고 있다 — 같은 attendee의 이전 태그가 REVOKED로 보존된 사례다.
  { id: 17, exhibitionId: 1, attendeeId: 1, token: 'c3e6a9b2-0017-4c33-9c00-cc0000000017', status: 'REVOKED', issuedByUserId: 1, issuedAt: '2026-07-14T09:40:00' },
  { id: 18, exhibitionId: 1, attendeeId: 2, token: 'c3e6a9b2-0018-4c33-9c00-cc0000000018', status: 'REVOKED', issuedByUserId: 1, issuedAt: '2026-07-14T10:20:00' },
]

let nextNameTagId = 19

function generateToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `tag-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

async function getAttendeeNameById(): Promise<Map<number, string>> {
  const reservations = await getReservations()
  const map = new Map<number, string>()
  reservations.forEach((reservation) => {
    reservation.attendees.forEach((attendee) => map.set(attendee.id, attendee.name))
  })
  return map
}

export interface NameTagView extends NameTag {
  attendeeName: string | null
}

export interface NameTagSummary {
  available: number
  issued: number
  revoked: number
}

export async function getNameTagSummary(exhibitionId: number): Promise<NameTagSummary> {
  const tags = mockNameTags.filter((tag) => tag.exhibitionId === exhibitionId)
  return mockDelay({
    available: tags.filter((tag) => tag.status === 'AVAILABLE').length,
    issued: tags.filter((tag) => tag.status === 'ISSUED').length,
    revoked: tags.filter((tag) => tag.status === 'REVOKED').length,
  })
}

export async function getNameTags(exhibitionId: number, status?: NameTagStatus): Promise<NameTagView[]> {
  const attendeeNameById = await getAttendeeNameById()
  const filtered = mockNameTags.filter((tag) => tag.exhibitionId === exhibitionId && (status === undefined || tag.status === status))

  return mockDelay(
    filtered.map((tag) => ({
      ...tag,
      attendeeName: tag.attendeeId !== null ? attendeeNameById.get(tag.attendeeId) ?? null : null,
    })),
  )
}

// POST /api/exhibitions/{id}/nametags/batch 목 구현(§6.4) — 인쇄용 AVAILABLE 토큰 N개를 한 번에
// 생성한다. 개인 이름은 담지 않는다(§3.3 사전 인쇄 풀).
export async function createNameTagBatch(exhibitionId: number, count: number): Promise<NameTag[]> {
  const created: NameTag[] = Array.from({ length: count }, () => ({
    id: nextNameTagId++,
    exhibitionId,
    attendeeId: null,
    token: generateToken(),
    status: 'AVAILABLE',
    issuedByUserId: null,
    issuedAt: null,
  }))
  mockNameTags = [...mockNameTags, ...created]
  return mockDelay(created)
}

// 아래는 lib/api/checkin.ts의 입구 바인딩(§3.3 2-스캔) 플로우가 사용하는 저수준 함수다.
// 가드 판단(AVAILABLE 아니면 거부 등)은 checkin.ts가 수행하고, 여기서는 단순 조회/상태 변경만 한다.
export async function findNameTagByToken(token: string): Promise<NameTag | null> {
  return mockDelay(mockNameTags.find((tag) => tag.token === token) ?? null)
}

// attendee당 활성 ISSUED 태그(있다면 1건)를 찾는다 — 재바인딩 시 자동 REVOKED 대상 판별용(§3.3).
export async function findActiveIssuedNameTagForAttendee(attendeeId: number): Promise<NameTag | null> {
  return mockDelay(mockNameTags.find((tag) => tag.attendeeId === attendeeId && tag.status === 'ISSUED') ?? null)
}

export async function markNameTagIssued(tagId: number, attendeeId: number, issuedByUserId: number): Promise<NameTag> {
  const issuedAt = new Date().toISOString()
  mockNameTags = mockNameTags.map((tag) => (tag.id === tagId ? { ...tag, attendeeId, status: 'ISSUED', issuedByUserId, issuedAt } : tag))
  return mockDelay(mockNameTags.find((tag) => tag.id === tagId) as NameTag)
}

export async function markNameTagRevoked(tagId: number): Promise<NameTag> {
  mockNameTags = mockNameTags.map((tag) => (tag.id === tagId ? { ...tag, status: 'REVOKED' } : tag))
  return mockDelay(mockNameTags.find((tag) => tag.id === tagId) as NameTag)
}
