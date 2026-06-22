import type { ReactNode } from 'react'

export function StatCard({
  label,
  icon,
  isLoading,
  isError,
  children,
}: {
  label: string
  icon?: ReactNode
  isLoading?: boolean
  isError?: boolean
  children: ReactNode
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <div className="mb-3.5 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted">{label}</span>
        {icon}
      </div>
      {isLoading ? (
        <p className="text-sm text-muted">불러오는 중...</p>
      ) : isError ? (
        <p className="text-sm text-danger">불러오지 못했습니다.</p>
      ) : (
        children
      )}
    </div>
  )
}
