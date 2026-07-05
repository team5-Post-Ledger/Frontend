import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AuthErrorBanner } from '../../components/AuthErrorBanner'
import { Field, fieldControlClass } from '../../components/Field'
import { acceptInvite } from '../../lib/api/invite'

function SuccessPanel() {
  return (
    <div className="rounded-lg border border-line bg-white p-10 text-center">
      <div className="mx-auto mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-full border-2 border-success">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-success"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <div className="text-xl font-bold text-ink">비밀번호가 설정되었습니다</div>
      <p className="mt-2.5 text-sm leading-relaxed text-muted">
        계정이 활성화되었어요. 설정한 비밀번호로 로그인해 주세요.
      </p>
      <Link
        to="/login"
        className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
      >
        로그인하러 가기
      </Link>
    </div>
  )
}

export default function InviteAcceptPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDone, setIsDone] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password.length < 8) {
      setErrorMessage('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    if (password !== passwordConfirm) {
      setErrorMessage('비밀번호가 서로 일치하지 않습니다. 다시 확인해 주세요.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      await acceptInvite(token, password)
      setIsDone(true)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '비밀번호 설정에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isDone) {
    return <SuccessPanel />
  }

  // 메일 링크가 잘못 복사되는 등 토큰 자체가 없으면 폼을 보여줄 이유가 없다.
  if (!token) {
    return (
      <div className="rounded-lg border border-line bg-white p-8">
        <h1 className="text-xl font-bold text-ink">유효하지 않은 초대 링크</h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted">
          초대 링크가 올바르지 않아요. 초대 메일의 링크를 다시 확인하거나, 관리자에게 재초대를 요청해 주세요.
        </p>
        <Link to="/login" className="mt-5 inline-block text-sm font-semibold text-primary hover:text-primary-hover">
          로그인 화면으로 →
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-line bg-white p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">비밀번호 설정</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          초대받은 계정에서 사용할 비밀번호를 설정하면 계정이 활성화됩니다.
        </p>
      </div>

      {errorMessage && <AuthErrorBanner message={errorMessage} />}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Field label="비밀번호" id="invite-password" required>
          <input
            id="invite-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="8자 이상 입력"
            autoComplete="new-password"
            className={fieldControlClass}
          />
        </Field>
        <Field label="비밀번호 확인" id="invite-password-confirm" required>
          <input
            id="invite-password-confirm"
            type="password"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            placeholder="비밀번호를 한 번 더 입력"
            autoComplete="new-password"
            className={fieldControlClass}
          />
        </Field>
        <button
          type="submit"
          disabled={isLoading}
          className="mt-1 flex h-12 items-center justify-center gap-2 rounded-md bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-default disabled:bg-muted"
        >
          {isLoading && (
            <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />
          )}
          {isLoading ? '설정 중...' : '비밀번호 설정'}
        </button>
      </form>

      <p className="mt-4 rounded-md bg-surface px-3.5 py-3 text-center text-xs leading-relaxed text-muted">
        초대 링크는 발송 후 72시간 동안만 유효해요. 만료되었다면 관리자에게 재초대를 요청해 주세요.
      </p>
    </div>
  )
}
