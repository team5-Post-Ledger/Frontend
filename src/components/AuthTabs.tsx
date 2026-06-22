import { Link } from 'react-router'

export function AuthTabs({ active }: { active: 'login' | 'signup' }) {
  return (
    <div className="mb-6 flex overflow-hidden rounded-md border border-line">
      <Link
        to="/login"
        className={`flex-1 py-2.5 text-center text-sm font-bold transition-colors ${
          active === 'login' ? 'bg-primary text-white' : 'bg-white text-muted hover:text-ink'
        }`}
      >
        로그인
      </Link>
      <Link
        to="/signup"
        className={`flex-1 py-2.5 text-center text-sm font-bold transition-colors ${
          active === 'signup' ? 'bg-primary text-white' : 'bg-white text-muted hover:text-ink'
        }`}
      >
        회원가입
      </Link>
    </div>
  )
}
