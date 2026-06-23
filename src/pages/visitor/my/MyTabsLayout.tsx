import { NavLink, Outlet } from 'react-router'

const TABS = [
  { to: '/my/reservations', label: '내 예약' },
  { to: '/my/tickets', label: '내 티켓' },
]

export default function MyTabsLayout() {
  return (
    <div className="mx-auto w-full max-w-5xl p-5 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold tracking-tight text-ink">내 정보</h1>
        <p className="mt-1 text-sm text-muted">예약 현황과 모바일 티켓을 확인하세요.</p>
      </div>

      <nav className="mb-6 flex gap-1 border-b border-line">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              [
                'border-b-2 px-4 py-3 text-sm font-semibold transition-colors',
                isActive ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink',
              ].join(' ')
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  )
}
