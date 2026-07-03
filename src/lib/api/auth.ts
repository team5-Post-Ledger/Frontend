import type { User } from '../../types'
import { mockDelay } from './mockClient'

export interface LoginResult {
  user: User
  token: string
}

const MOCK_ACCOUNTS: Array<{ email: string; password: string; user: User }> = [
  {
    email: 'visitor@fairpilot.io',
    password: 'password',
    user: { id: 1, email: 'visitor@fairpilot.io', name: '김민수', phone: '010-1111-1111', role: 'VISITOR', deletedAt: null },
  },
  {
    email: 'admin@fairpilot.io',
    password: 'password',
    user: { id: 2, email: 'admin@fairpilot.io', name: '김운영', phone: '010-2222-2222', role: 'EXPO_ADMIN', deletedAt: null },
  },
  {
    email: 'platform@fairpilot.io',
    password: 'password',
    user: { id: 3, email: 'platform@fairpilot.io', name: '박플랫폼', phone: null, role: 'PLATFORM_ADMIN', deletedAt: null },
  },
  {
    email: 'accountant@fairpilot.io',
    password: 'password',
    user: { id: 4, email: 'accountant@fairpilot.io', name: '이회계', phone: null, role: 'ACCOUNTANT', deletedAt: null },
  },
  {
    email: 'staff@fairpilot.io',
    password: 'password',
    user: { id: 5, email: 'staff@fairpilot.io', name: '최스태프', phone: null, role: 'STAFF', deletedAt: null },
  },
  {
    email: 'exhibitor@fairpilot.io',
    password: 'password',
    user: { id: 6, email: 'exhibitor@fairpilot.io', name: '정참가', phone: null, role: 'EXHIBITOR', deletedAt: null },
  },
]

// TODO(연동): 실제 POST /api/auth/login 응답은 { accessToken, refreshToken }뿐이고 user 정보가 없다.
// role을 JWT payload 디코드로 얻을 수 있는지, 아니면 별도 프로필 조회가 필요한지 실측 후
// 이 함수의 반환값 구성 방식을 다시 정한다 — 실제 연동 담당자가 확인.
export async function login(email: string, password: string): Promise<LoginResult> {
  if (!password) {
    throw new Error('비밀번호를 입력해주세요.')
  }

  const account = MOCK_ACCOUNTS.find((candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase())

  if (!account || account.password !== password) {
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
  }

  return mockDelay({ user: account.user, token: 'mock-jwt-token' })
}

export interface SignupInput {
  email: string
  password: string
  name: string
  phone: string
}

export async function signup(input: SignupInput): Promise<LoginResult> {
  const email = input.email.trim()
  const name = input.name.trim()

  if (!email || !input.password || !name) {
    throw new Error('필수 항목(이메일·비밀번호·이름)을 입력해주세요.')
  }

  if (input.password.length < 8) {
    throw new Error('비밀번호는 8자 이상이어야 합니다.')
  }

  if (MOCK_ACCOUNTS.some((account) => account.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('이미 가입된 이메일입니다.')
  }

  const newUser: User = {
    id: MOCK_ACCOUNTS.length + 1,
    email,
    name,
    phone: input.phone.trim() || null,
    role: 'VISITOR',
    deletedAt: null,
  }

  MOCK_ACCOUNTS.push({ email, password: input.password, user: newUser })
  await mockDelay(null)

  // 실제 POST /api/auth/signup은 토큰을 내려주지 않는다(성공 시 data: null) — 가입 후
  // 별도 로그인 호출로 세션을 받아오는 게 실제 계약이라 mock도 동일한 흐름으로 맞춘다.
  return login(email, input.password)
}
