import axios from 'axios'
import type { AxiosError, AxiosRequestConfig } from 'axios'
import { getToken } from '../auth'

// 2번 개발자 API 명세서 v2 기준 4개 백엔드 모듈. vite.config.ts의 server.proxy 접두어와 1:1로 대응한다.
export type ApiModule = 'visitor' | 'expo-admin' | 'platform-admin' | 'exhibitor'

// 공통 응답 포맷: { success, data, message } — body:[] 아님(2026-07-03 확인).
interface ApiEnvelope<T> {
  success: boolean
  data: T
  message: string | null
}

const client = axios.create()

client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => {
    const envelope = response.data as ApiEnvelope<unknown>
    if (!envelope.success) {
      // TODO(연동): 에러 응답에 message 외 code 필드가 있는지 등 실제 형태 미실측 — 확인되면 보강.
      throw new Error(envelope.message ?? '요청 처리에 실패했습니다.')
    }
    response.data = envelope.data
    return response
  },
  (error: AxiosError) => {
    // TODO(연동): 401(UNAUTHORIZED) 시 refreshToken으로 재시도하는 로직은 로그인 응답에서
    // refreshToken을 실제로 저장하기 시작한 뒤(lib/api/auth.ts의 login TODO 참고) 추가한다.
    // 지금은 저장된 refreshToken이 없어 재시도할 수 없으므로 그대로 실패 처리한다.
    return Promise.reject(error)
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
