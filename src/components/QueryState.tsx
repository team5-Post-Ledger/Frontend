import type { ReactNode } from 'react'

export function QueryState({
  isLoading,
  isError,
  isEmpty,
  height = 240,
  children,
}: {
  isLoading: boolean
  isError: boolean
  isEmpty?: boolean
  height?: number
  children: ReactNode
}) {
  if (isLoading) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-sm text-muted">
        불러오는 중...
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-sm text-danger">
        데이터를 불러오지 못했습니다.
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-sm text-muted">
        표시할 데이터가 없습니다.
      </div>
    )
  }

  return <>{children}</>
}
