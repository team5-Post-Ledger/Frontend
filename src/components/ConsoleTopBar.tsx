import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import { ConsoleUserMenu } from './ConsoleUserMenu'
import { NavOverflowMenu, type NavOverflowGroup } from './NavOverflowMenu'

export interface ConsoleNavItem {
  to: string
  label: string
  end?: boolean
}

export type ConsoleNavGroup = NavOverflowGroup

interface ConsoleTopBarProps {
  homeTo: string
  consoleName: string
  primaryNav?: ConsoleNavItem[]
  overflowGroups?: ConsoleNavGroup[]
  contextSlot?: ReactNode
  user: { name?: string; role?: string }
  onLogout: () => void
  mainSiteHref?: string
}

// 밝은 상단바용 네비 항목 스타일(어두운 사이드바용과 다르다). 탭 메타포로
// active 시 하단 2px border-primary. 항목은 바 높이를 꽉 채워 하단선이 바 바닥에 붙는다.
const NAV_ITEM_CLASS = ({ isActive }: { isActive: boolean }) =>
  [
    'inline-flex h-16 items-center border-b-2 px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary',
    isActive
      ? 'border-primary text-primary'
      : 'border-transparent text-muted hover:bg-surface hover:text-ink',
  ].join(' ')

export function ConsoleTopBar({
  homeTo,
  consoleName,
  primaryNav,
  overflowGroups,
  contextSlot,
  user,
  onLogout,
  mainSiteHref,
}: ConsoleTopBarProps) {
  const hasNav = (primaryNav && primaryNav.length > 0) || (overflowGroups && overflowGroups.length > 0)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-stretch gap-4 border-b border-line bg-white px-6">
      <Link
        to={homeTo}
        className="flex shrink-0 items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span className="flex h-8 w-8 items-center justify-center bg-shell">
          <span className="h-3.5 w-3.5 rotate-45 bg-primary" />
        </span>
        <div className="leading-tight">
          <div className="text-base font-extrabold tracking-tight text-ink">FairPilot</div>
          <div className="text-[11px] font-semibold text-muted">{consoleName}</div>
        </div>
      </Link>

      {hasNav && (
        <nav className="flex shrink-0 items-stretch">
          {primaryNav?.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={NAV_ITEM_CLASS}>
              {item.label}
            </NavLink>
          ))}
          {overflowGroups && overflowGroups.length > 0 && <NavOverflowMenu groups={overflowGroups} />}
        </nav>
      )}

      <div className="flex min-w-0 flex-1 items-center">{contextSlot}</div>

      <div className="flex shrink-0 items-center gap-3">
        {mainSiteHref && (
          <Link
            to={mainSiteHref}
            className="text-sm font-semibold text-muted transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            메인 사이트
          </Link>
        )}
        <ConsoleUserMenu name={user.name} role={user.role} onLogout={onLogout} />
      </div>
    </header>
  )
}
