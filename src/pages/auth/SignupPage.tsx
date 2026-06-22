import type { FormEvent } from 'react'
import { useState } from 'react'
import { AuthErrorBanner } from '../../components/AuthErrorBanner'
import { AuthSuccessPanel } from '../../components/AuthSuccessPanel'
import { AuthTabs } from '../../components/AuthTabs'
import { usePostAuthRedirect } from '../../hooks/usePostAuthRedirect'
import { signup } from '../../lib/api/auth'
import { useAuthStore } from '../../stores/authStore'
import type { Role } from '../../types'

export default function SignupPage() {
  const storeLogin = useAuthStore((state) => state.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [signedUpRole, setSignedUpRole] = useState<Role | null>(null)

  usePostAuthRedirect(signedUpRole)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim() || !password || !name.trim()) {
      setErrorMessage('필수 항목(이메일·비밀번호·이름)을 입력해주세요.')
      return
    }

    if (password.length < 8) {
      setErrorMessage('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await signup({ email: email.trim(), password, name: name.trim(), phone: phone.trim() })
      storeLogin(result.user, result.token)
      setSignedUpRole(result.user.role)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '회원가입에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (signedUpRole) {
    return <AuthSuccessPanel title="회원가입 완료" message="방문객 계정이 생성되었습니다. 페이지로 이동합니다." />
  }

  return (
    <div className="rounded-lg border border-line bg-white p-8">
      <AuthTabs active="signup" />

      {errorMessage && <AuthErrorBanner message={errorMessage} />}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="signup-email" className="mb-1.5 block text-sm font-semibold text-muted">
            이메일 <span className="text-danger">*</span>
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@email.com"
            autoComplete="email"
            className="w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label htmlFor="signup-password" className="mb-1.5 block text-sm font-semibold text-muted">
            비밀번호 <span className="text-danger">*</span>
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="8자 이상 입력"
            autoComplete="new-password"
            className="w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label htmlFor="signup-name" className="mb-1.5 block text-sm font-semibold text-muted">
            이름 <span className="text-danger">*</span>
          </label>
          <input
            id="signup-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="홍길동"
            autoComplete="name"
            className="w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label htmlFor="signup-phone" className="mb-1.5 block text-sm font-semibold text-muted">
            전화번호 <span className="text-muted">선택</span>
          </label>
          <input
            id="signup-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="010-0000-0000"
            autoComplete="tel"
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
          {isLoading ? '처리 중...' : '가입하기'}
        </button>
      </form>

      <p className="mt-4 rounded-md bg-surface px-3.5 py-3 text-center text-xs leading-relaxed text-muted">
        가입 시 방문객 계정이 생성됩니다.
      </p>
    </div>
  )
}
