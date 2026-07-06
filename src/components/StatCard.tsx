import type { ReactNode } from 'react'
import { Link } from 'react-router'

interface StatCardProps {
  label: string
  icon?: ReactNode
  isLoading?: boolean
  isError?: boolean
  // 있으면 카드를 Link로 렌더해 클릭 시 이동한다(비파괴적 — 없으면 기존 div 그대로).
  to?: string
  children: ReactNode
}

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted transition-colors group-hover:text-primary"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function StatCard({ label, icon, isLoading, isError, to, children }: StatCardProps) {
  const body = (
    <>
      <div className="mb-3.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium text-muted">
          {label}
          {to && <ArrowIcon />}
        </span>
        {icon}
      </div>
      {isLoading ? (
        <p className="text-sm text-muted">불러오는 중...</p>
      ) : isError ? (
        <p className="text-sm text-danger">불러오지 못했습니다.</p>
      ) : (
        children
      )}
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="group block rounded-lg border border-line bg-white p-5 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {body}
      </Link>
    )
  }

  return <div className="rounded-lg border border-line bg-white p-5">{body}</div>
}
