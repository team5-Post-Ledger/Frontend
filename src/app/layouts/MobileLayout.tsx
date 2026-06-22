import { Outlet } from 'react-router'
import { useAuthStore } from '../../stores/authStore'

export function MobileLayout() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <header className="flex h-14 items-center justify-between border-b border-line bg-white px-4">
        <span className="text-base font-semibold text-primary">FairPilot</span>
        <span className="text-sm text-muted">{user?.name}</span>
      </header>
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  )
}
