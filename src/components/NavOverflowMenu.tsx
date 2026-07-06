import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router'

export interface NavOverflowItem {
  to: string
  label: string
  end?: boolean
}

export interface NavOverflowGroup {
  label: string
  items: NavOverflowItem[]
}

interface NavOverflowMenuProps {
  groups: NavOverflowGroup[]
  label?: string
}

// NavLink의 active 판정을 트리거에서도 재현한다 — 드롭다운 안 항목에 머무를 때
// "더보기" 트리거 자체를 active로 표시해 사용자에게 현재 위치를 알린다.
function isPathActive(pathname: string, to: string, end?: boolean): boolean {
  if (end) return pathname === to
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function NavOverflowMenu({ groups, label = '더보기' }: NavOverflowMenuProps) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const anyChildActive = groups.some((group) =>
    group.items.some((item) => isPathActive(pathname, item.to, item.end)),
  )

  // 외부 클릭 시 닫기.
  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  // Esc로 닫고 포커스를 트리거로 되돌린다.
  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const triggerActive = anyChildActive || open

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={[
          'inline-flex h-16 items-center gap-1 border-b-2 px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary',
          triggerActive
            ? 'border-primary text-primary'
            : 'border-transparent text-muted hover:bg-surface hover:text-ink',
        ].join(' ')}
      >
        {label}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 min-w-[220px] border border-line bg-white py-1.5 shadow-md"
        >
          {groups.map((group) => (
            <div key={group.label} className="py-1">
              <div className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                {group.label}
              </div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    [
                      'block px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary',
                      isActive ? 'bg-surface text-primary' : 'text-ink hover:bg-surface',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
