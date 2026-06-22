import type { FormEvent } from 'react'
import { useState } from 'react'
import { AuthErrorBanner } from '../../components/AuthErrorBanner'
import { AuthSuccessPanel } from '../../components/AuthSuccessPanel'
import { AuthTabs } from '../../components/AuthTabs'
import { usePostAuthRedirect } from '../../hooks/usePostAuthRedirect'
import { login } from '../../lib/api/auth'
import { useAuthStore } from '../../stores/authStore'
import type { Role } from '../../types'

export default function LoginPage() {
  const storeLogin = useAuthStore((state) => state.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loggedInRole, setLoggedInRole] = useState<Role | null>(null)

  usePostAuthRedirect(loggedInRole)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim() || !password) {
      setErrorMessage('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await login(email.trim(), password)
      storeLogin(result.user, result.token)
      setLoggedInRole(result.user.role)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '로그인에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (loggedInRole) {
    return <AuthSuccessPanel title="로그인 성공" message="환영합니다. 페이지로 이동합니다." />
  }

  return (
    <div className="rounded-lg border border-line bg-white p-8">
      <AuthTabs active="login" />

      {errorMessage && <AuthErrorBanner message={errorMessage} />}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold text-muted">
            이메일
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@company.com"
            autoComplete="email"
            className="w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="mb-1.5 block text-sm font-semibold text-muted">
            비밀번호
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호 입력"
            autoComplete="current-password"
            className="w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="mt-1 flex h-12 items-center justify-center gap-2 rounded-md bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-default disabled:bg-muted"
        >
          {isLoading && (
            <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />
          )}
          {isLoading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <p className="mt-4 border-t border-line pt-4 text-center text-xs leading-relaxed text-muted">
        주최·스태프·참가기업·회계 계정은 운영자가 발급합니다. 공개 가입은 제공되지 않습니다.
      </p>
    </div>
  )
}
