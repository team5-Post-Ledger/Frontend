import type { AuthUser } from '../../types'
import { USE_MOCK } from './config'
import { apiGet, apiPost } from './httpClient'
import { mockDelay } from './mockClient'

export interface LoginResult {
  user: AuthUser
  token: string
  refreshToken?: string
}

const MOCK_ACCOUNTS: Array<{ email: string; password: string; user: AuthUser }> = [
  {
    email: 'visitor@fairpilot.io',
    password: 'password',
    user: {
      id: 1,
      email: 'visitor@fairpilot.io',
      name: '김민수',
      phone: '010-1111-1111',
      role: 'VISITOR',
      accountStatus: 'ACTIVE',
      isDeleted: false,
      assignedExhibitionIds: [],
    },
  },
  {
    email: 'admin@fairpilot.io',
    password: 'password',
    user: {
      id: 2,
      email: 'admin@fairpilot.io',
      name: '김운영',
      phone: '010-2222-2222',
      role: 'EXPO_ADMIN',
      accountStatus: 'ACTIVE',
      isDeleted: false,
      assignedExhibitionIds: [1, 2, 3],
    },
  },
  {
    email: 'platform@fairpilot.io',
    password: 'password',
    user: {
      id: 3,
      email: 'platform@fairpilot.io',
      name: '박플랫폼',
      phone: null,
      role: 'PLATFORM_ADMIN',
      accountStatus: 'ACTIVE',
      isDeleted: false,
      assignedExhibitionIds: [],
    },
  },
  {
    email: 'accountant@fairpilot.io',
    password: 'password',
    user: {
      id: 4,
      email: 'accountant@fairpilot.io',
      name: '이회계',
      phone: null,
      role: 'ACCOUNTANT',
      accountStatus: 'ACTIVE',
      isDeleted: false,
      assignedExhibitionIds: [],
    },
  },
  {
    email: 'staff@fairpilot.io',
    password: 'password',
    user: {
      id: 5,
      email: 'staff@fairpilot.io',
      name: '최스태프',
      phone: null,
      role: 'STAFF',
      accountStatus: 'ACTIVE',
      isDeleted: false,
      assignedExhibitionIds: [1, 2],
    },
  },
  {
    email: 'exhibitor@fairpilot.io',
    password: 'password',
    user: {
      id: 6,
      email: 'exhibitor@fairpilot.io',
      name: '정참가',
      phone: null,
      role: 'EXHIBITOR',
      accountStatus: 'ACTIVE',
      isDeleted: false,
      assignedExhibitionIds: [],
    },
  },
]

// 실 백엔드 응답(2026-07-06 실측):
//   POST /api/auth/login → { accessToken(JWT), refreshToken(UUID) } (user 정보 없음)
//   GET  /api/auth/me    → { id,email,name,phone,role,accountStatus,isDeleted,assignedExhibitionIds } === AuthUser
// user는 로그인 응답에 없으므로 토큰을 받은 직후 /me로 확정한다. /me의 응답 필드가 AuthUser와
// 1:1이라 별도 어댑터가 필요 없다.
interface LoginTokens {
  accessToken: string
  refreshToken: string
}

export async function login(email: string, password: string): Promise<LoginResult> {
  if (USE_MOCK) return mockLogin(email, password)

  const trimmedEmail = email.trim()
  const tokens = await apiPost<LoginTokens>('visitor', '/api/auth/login', {
    email: trimmedEmail,
    password,
  })
  // 아직 저장 전이라 요청 인터셉터가 토큰을 못 붙인다 → 방금 받은 accessToken을 명시적으로 실어 /me 호출.
  const user = await apiGet<AuthUser>('visitor', '/api/auth/me', {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  })
  return { user, token: tokens.accessToken, refreshToken: tokens.refreshToken }
}

async function mockLogin(email: string, password: string): Promise<LoginResult> {
  if (!password) {
    throw new Error('비밀번호를 입력해주세요.')
  }

  const account = MOCK_ACCOUNTS.find((candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase())

  if (!account || account.password !== password) {
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
  }

  return mockDelay({ user: account.user, token: 'mock-jwt-token', refreshToken: 'mock-refresh-token' })
}

export interface SignupInput {
  email: string
  password: string
  name: string
  phone: string
}

// 실 백엔드 POST /api/auth/signup은 성공 시 data:null(토큰 없음, VISITOR만 가능). 가입 후 곧바로
// login()을 호출해 세션(토큰+user)을 확보하는 게 실제 계약이라 mock도 동일한 흐름으로 맞춘다.
export async function signup(input: SignupInput): Promise<LoginResult> {
  if (USE_MOCK) return mockSignup(input)

  const email = input.email.trim()
  await apiPost<null>('visitor', '/api/auth/signup', {
    email,
    password: input.password,
    name: input.name.trim(),
    phone: input.phone.trim() || null,
  })
  return login(email, input.password)
}

async function mockSignup(input: SignupInput): Promise<LoginResult> {
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

  const newUser: AuthUser = {
    id: MOCK_ACCOUNTS.length + 1,
    email,
    name,
    phone: input.phone.trim() || null,
    role: 'VISITOR',
    accountStatus: 'ACTIVE',
    isDeleted: false,
    assignedExhibitionIds: [],
  }

  MOCK_ACCOUNTS.push({ email, password: input.password, user: newUser })
  await mockDelay(null)

  return mockLogin(email, input.password)
}

// 로그아웃: 서버의 refreshToken을 무효화한다(@RequestParam refreshToken). best-effort —
// 실패해도 클라이언트 세션은 authStore가 이미 정리하므로 사용자 흐름을 막지 않는다.
export async function logout(refreshToken: string | null): Promise<void> {
  if (USE_MOCK || !refreshToken) return
  try {
    await apiPost<null>('visitor', '/api/auth/logout', null, { params: { refreshToken } })
  } catch {
    // 무시(best-effort).
  }
}
