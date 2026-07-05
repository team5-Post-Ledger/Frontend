import type { Role } from '../../types'

// 관리자 초대 토큰 mock 저장소 (2번_개발자_API_명세서.md §2).
// features/platform/api.ts(초대 발급·상태 파생)와 lib/api/invite.ts(수락)가 공유한다.
// 실제 연동 시 이 모듈은 통째로 사라지고 각 API 함수 본문이 axios 호출로 바뀐다.
export interface InviteRecord {
  token: string
  email: string
  role: Role
  expiresAt: string // ISO — 명세상 발급 후 72시간
  acceptedAt: string | null
}

const INVITE_TTL_MS = 72 * 60 * 60 * 1000

function nowIso() {
  return new Date().toISOString()
}

function futureIso(ms: number) {
  return new Date(Date.now() + ms).toISOString()
}

// 시드 토큰 3종 — /invite/accept 화면의 성공/만료/사용됨 상태를 브라우저에서 바로 검증하기 위한 값.
// 이메일은 platformSeed.ts의 INVITED 시드 유저와 연결된다.
let inviteRecords: InviteRecord[] = [
  {
    token: 'demo-invite-valid',
    email: 'expo.invited@fairpilot.io',
    role: 'EXPO_ADMIN',
    expiresAt: futureIso(INVITE_TTL_MS),
    acceptedAt: null,
  },
  {
    token: 'demo-invite-expired',
    email: 'accounting.invited@fairpilot.io',
    role: 'ACCOUNTANT',
    expiresAt: '2026-01-01T00:00:00.000Z',
    acceptedAt: null,
  },
  {
    token: 'demo-invite-used',
    email: 'admin@fairpilot.io',
    role: 'EXPO_ADMIN',
    expiresAt: futureIso(INVITE_TTL_MS),
    acceptedAt: '2026-06-01T09:00:00.000Z',
  },
]

/** 미수락(만료 포함) 초대가 있는지 — 계정 목록의 INVITED 상태 파생에 쓴다. */
export function findPendingInviteByEmail(email: string): InviteRecord | undefined {
  return inviteRecords.find(
    (record) => record.email.toLowerCase() === email.toLowerCase() && record.acceptedAt === null,
  )
}

/** 초대 발급/재발급. 기존 미수락 토큰이 있으면 폐기하고 새 토큰으로 교체한다(명세: INVITED 재초대 시 토큰 재발급). */
export function issueInvite(email: string, role: Role): InviteRecord {
  inviteRecords = inviteRecords.filter(
    (record) => !(record.email.toLowerCase() === email.toLowerCase() && record.acceptedAt === null),
  )

  const record: InviteRecord = {
    token: `invite-${Math.random().toString(36).slice(2, 10)}`,
    email,
    role,
    expiresAt: futureIso(INVITE_TTL_MS),
    acceptedAt: null,
  }
  inviteRecords = [record, ...inviteRecords]
  return record
}

/** 초대 수락. 성공 시 acceptedAt을 기록하고 이메일을 반환한다. 실패 사유는 사용자에게 그대로 보여줄 한국어 메시지로 던진다. */
export function acceptInviteToken(token: string): { email: string } {
  const record = inviteRecords.find((item) => item.token === token)

  if (!record) {
    throw new Error('유효하지 않은 초대 링크예요. 관리자에게 재초대를 요청해 주세요.')
  }
  if (record.acceptedAt !== null) {
    throw new Error('이미 사용된 초대 링크예요. 비밀번호를 이미 설정했다면 로그인해 주세요.')
  }
  if (record.expiresAt < nowIso()) {
    throw new Error('초대가 만료되었어요. 관리자에게 재초대를 요청해 주세요.')
  }

  record.acceptedAt = nowIso()
  return { email: record.email }
}
