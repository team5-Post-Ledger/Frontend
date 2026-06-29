import { Link, useNavigate } from 'react-router'
import { SystemPageShell } from '../components/SystemPageShell'
import { ROLE_HOME } from '../hooks/usePostAuthRedirect'
import { useAuthStore } from '../stores/authStore'

export default function ForbiddenPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <SystemPageShell
      code="403"
      title="접근 권한이 없습니다"
      message="이 페이지를 볼 수 있는 권한이 없습니다."
      actions={
        user ? (
          <>
            <button
              type="button"
              onClick={() => navigate(ROLE_HOME[user.role], { replace: true })}
              className="w-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              내 홈으로
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full border border-line py-2.5 text-sm font-semibold text-muted transition-colors hover:border-ink hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"
            >
              로그아웃
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="block w-full bg-primary py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            로그인하러 가기
          </Link>
        )
      }
    />
  )
}
