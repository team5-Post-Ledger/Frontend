import { acceptInviteToken } from '../mock/inviteStore'
import { mockDelay } from './mockClient'

// POST /api/invite/accept (api-visitor, Public — 초대받은 사람은 JWT 없음).
// 성공 시 백엔드가 비밀번호 저장 + 계정 ACTIVE 전환 + 토큰 소멸 처리. 응답은 data: null이라 반환값 없음.
export async function acceptInvite(token: string, password: string): Promise<void> {
  if (!token) {
    throw new Error('유효하지 않은 초대 링크예요. 관리자에게 재초대를 요청해 주세요.')
  }
  if (password.length < 8) {
    throw new Error('비밀번호는 8자 이상이어야 합니다.')
  }

  acceptInviteToken(token)
  await mockDelay(null, 450)
}
