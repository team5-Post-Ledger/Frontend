import axios from 'axios'
import type { AxiosError, AxiosRequestConfig } from 'axios'
import type { ApiErrorCode } from '../../types'
import { getRefreshToken, getStoredUserId, getToken, updateTokens } from '../auth'

// 2번 개발자 API 명세서 v2 기준 4개 백엔드 모듈. vite.config.ts의 server.proxy 접두어와 1:1로 대응한다.
export type ApiModule = 'visitor' | 'expo-admin' | 'platform-admin' | 'exhibitor'

// 공통 응답 포맷: { success, data, message } — body:[] 아님(2026-07-03 확인).
// 실제 백엔드 ApiResponse(record)에는 `code` 필드가 없다(2026-07-06 실측). 에러 식별은 아래
// statusToCode()로 HTTP status에서 파생한다.
interface ApiEnvelope<T> {
  success: boolean
  data: T
  message: string | null
}

export class ApiError extends Error {
  code?: ApiErrorCode
  status?: number

  constructor(message: string, options: { code?: ApiErrorCode; status?: number } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = options.code
    this.status = options.status
  }
}

// 백엔드는 응답 body에 에러 코드를 주지 않고 HTTP status로만 구분한다(domain-core ErrorCode → status).
// 화면 분기에 필요한 최소 매핑만 한다. 409(SLOT_SOLD_OUT vs DUPLICATE_RESERVATION 등)는
// status만으로 세분화가 불가능하므로 CONFLICT로 뭉친다 — 세분이 필요한 화면은 message를 함께 본다.
function statusToCode(status?: number): ApiErrorCode | undefined {
  switch (status) {
    case 400:
      return 'BAD_REQUEST'
    case 401:
      return 'UNAUTHORIZED'
    case 403:
      return 'FORBIDDEN'
    case 404:
      return 'NOT_FOUND'
    case 409:
    case 410: // HOLD_EXPIRED
    case 429: // QUEUE_NOT_ALLOWED
      return 'CONFLICT'
    case 422:
      return 'VALIDATION_ERROR'
    case 500:
    case 503: // UPSTREAM_ERROR
      return 'INTERNAL_SERVER_ERROR'
    default:
      return undefined
  }
}

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean
}

const client = axios.create()

client.interceptors.request.use((config) => {
  const token = getToken()
  // login 중 /me 호출처럼 요청이 명시적 Authorization을 이미 지정했다면(아직 저장 전 토큰) 덮어쓰지 않는다.
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // 예약/큐 컨트롤러가 신원을 X-User-Id 헤더로 받는다(현 백엔드 계약, JWT @CurrentUser 아님).
  // 안 쓰는 요청에도 붙지만 백엔드가 무시하므로 무해하다.
  const userId = getStoredUserId()
  if (userId != null && !config.headers['X-User-Id']) {
    config.headers['X-User-Id'] = String(userId)
  }
  return config
})

// 무한 루프 방지: auth 엔드포인트 자체(로그인/갱신/로그아웃)의 401은 refresh 재시도 대상에서 제외한다.
function isAuthEndpoint(url?: string): boolean {
  return typeof url === 'string' && url.includes('/api/auth/')
}

// 401 → refreshToken으로 accessToken 재발급(1회) → 원요청 재시도.
// 주의(2026-07-06 실측): 백엔드는 만료/무효 JWT를 보호 라우트에서 403(Http403ForbiddenEntryPoint)으로
// 내려준다. 401은 로그인 실패 같은 명시적 BusinessException에서만 나온다. 따라서 이 재시도는 실제
// access token 만료 상황(403)에서는 거의 발동하지 않는다 — 그건 의도된 보수적 동작이다. 403은 권한
// 거부와 구분이 안 되므로 여기서 refresh를 시도하지 않는다.
// 또한 refresh 실패 시 강제 로그아웃하지 않고 요청만 reject한다(백엔드 refresh가 아직 불안정: 유효
// 토큰에도 500을 반환하는 케이스 확인). 백엔드 refresh가 안정화되면 만료 처리 UX를 다시 정한다.
async function tryRefreshAndRetry(error: AxiosError): Promise<unknown> {
  const original = error.config as RetriableConfig | undefined
  const refreshToken = getRefreshToken()

  if (!original || original._retry || isAuthEndpoint(original.url) || !refreshToken) {
    return Promise.reject(toApiError(error))
  }

  original._retry = true
  try {
    // refresh는 refreshToken을 쿼리 파라미터로 받는다(@RequestParam, JSON body 아님 — 2026-07-06 실측).
    // 인터셉터 재귀를 피하려고 client가 아닌 순수 axios로 호출한다.
    const res = await axios.post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>(
      '/proxy/visitor/api/auth/refresh',
      null,
      { params: { refreshToken } },
    )
    if (!res.data.success) throw new Error(res.data.message ?? 'refresh failed')

    updateTokens(res.data.data.accessToken, res.data.data.refreshToken)
    original.headers = { ...original.headers, Authorization: `Bearer ${res.data.data.accessToken}` }
    return client(original)
  } catch {
    return Promise.reject(toApiError(error))
  }
}

function toApiError(error: AxiosError): ApiError {
  const envelope = error.response?.data as Partial<ApiEnvelope<unknown>> | undefined
  const status = error.response?.status
  return new ApiError(envelope?.message ?? '요청 처리에 실패했습니다.', {
    code: statusToCode(status),
    status,
  })
}

client.interceptors.response.use(
  (response) => {
    const envelope = response.data as ApiEnvelope<unknown>
    if (!envelope.success) {
      throw new ApiError(envelope.message ?? '요청 처리에 실패했습니다.', {
        status: response.status,
      })
    }
    response.data = envelope.data
    return response
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      return tryRefreshAndRetry(error)
    }
    return Promise.reject(toApiError(error))
  },
)

function toPath(apiModule: ApiModule, path: string): string {
  return `/proxy/${apiModule}${path}`
}

export function apiGet<T>(apiModule: ApiModule, path: string, config?: AxiosRequestConfig): Promise<T> {
  return client.get(toPath(apiModule, path), config).then((res) => res.data as T)
}

export function apiPost<T>(
  apiModule: ApiModule,
  path: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  return client.post(toPath(apiModule, path), body, config).then((res) => res.data as T)
}

export function apiPut<T>(
  apiModule: ApiModule,
  path: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  return client.put(toPath(apiModule, path), body, config).then((res) => res.data as T)
}

export function apiDelete<T>(apiModule: ApiModule, path: string, config?: AxiosRequestConfig): Promise<T> {
  return client.delete(toPath(apiModule, path), config).then((res) => res.data as T)
}
