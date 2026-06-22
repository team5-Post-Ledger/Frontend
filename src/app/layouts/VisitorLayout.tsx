import { Outlet } from 'react-router'

export function VisitorLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <header className="flex h-14 items-center border-b border-line bg-white px-4">
        <span className="text-lg font-semibold text-primary">FairPilot</span>
      </header>
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 h-16 border-t border-line bg-white" />
    </div>
  )
}
