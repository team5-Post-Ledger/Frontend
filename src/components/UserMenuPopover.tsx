import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { AuthUser } from '../types/entities'

export function UserMenuPopover({
  user,
  consoleTo,
  onLogout,
}: {
  user: AuthUser
  /** VISITOR가 아닌 계정의 콘솔 홈 경로. 있으면 "내 콘솔로" 항목을 노출한다. */
  consoleTo?: string
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function handleLogout() {
    setOpen(false)
    onLogout()
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="계정 메뉴"
        className={`flex h-8 w-8 items-center justify-center bg-primary text-xs font-bold text-white outline-none transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${
          open ? 'bg-primary-hover' : ''
        }`}
      >
        {user.name.slice(0, 1)}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+4px)] z-20 w-44 border border-line bg-white shadow-sm">
          <div className="border-b border-line px-3.5 py-2.5 text-sm font-semibold text-ink">{user.name}님</div>
          {consoleTo && (
            <Link
              to={consoleTo}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex h-10 items-center px-3.5 text-sm font-semibold text-primary outline-none transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
            >
              내 콘솔로
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex h-10 w-full items-center px-3.5 text-sm font-semibold text-muted outline-none transition-colors hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  )
}
