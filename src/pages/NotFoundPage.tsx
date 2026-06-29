import { useNavigate } from 'react-router'
import { SystemPageShell } from '../components/SystemPageShell'
import { ROLE_HOME } from '../hooks/usePostAuthRedirect'
import { useAuthStore } from '../stores/authStore'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  return (
    <SystemPageShell
      code="404"
      title="페이지를 찾을 수 없습니다"
      message="요청하신 페이지가 존재하지 않거나 이동되었습니다."
      actions={
        <button
          type="button"
          onClick={() => navigate(user ? ROLE_HOME[user.role] : '/', { replace: true })}
          className="w-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          홈으로
        </button>
      }
    />
  )
}
