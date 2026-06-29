import { Outlet, useNavigate } from 'react-router'
import { useExhibitorContext } from '../../features/scanner/hooks'
import { useAuthStore } from '../../stores/authStore'

export function ScannerLayout() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const { data: ctx } = useExhibitorContext()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <header className="flex h-14 shrink-0 items-center justify-between bg-shell px-5">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-white">FairPilot</span>
          {ctx && (
            <>
              <span className="h-4 w-px bg-white/20" />
              <span className="text-sm text-white/60">{ctx.exhibitionTitle}</span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-white/55 transition-colors hover:text-white"
        >
          로그아웃
        </button>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
