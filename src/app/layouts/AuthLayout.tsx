import { Link, Outlet } from 'react-router'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-5">
      <div className="w-full max-w-[420px]">
        <Link to="/" className="mb-4 flex items-center justify-center gap-2">
          <span className="h-5 w-5 rotate-45 bg-primary" />
          <span className="text-lg font-extrabold tracking-tight text-primary">FairPilot</span>
        </Link>
        <Outlet />
      </div>
    </div>
  )
}
