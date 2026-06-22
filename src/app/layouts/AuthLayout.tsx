import { Outlet } from 'react-router'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-5">
      <div className="w-full max-w-[420px]">
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="h-5 w-5 rotate-45 rounded-md bg-accent" />
          <span className="text-lg font-extrabold tracking-tight text-ink">FairPilot</span>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
