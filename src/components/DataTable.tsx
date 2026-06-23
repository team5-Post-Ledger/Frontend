import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { QueryState } from './QueryState'

export interface DataTableColumn<T> {
  key: string
  header: string
  align?: 'left' | 'center' | 'right'
  width?: string
  sortable?: boolean
  sortValue?: (row: T) => string | number
  render?: (row: T) => ReactNode
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  rowKey: (row: T) => string | number
  toolbar?: ReactNode
  isLoading?: boolean
  isError?: boolean
  emptyMessage?: string
  pageSize?: number
  onRowClick?: (row: T) => void
}

function SortIcon({ direction }: { direction: 'asc' | 'desc' | null }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {direction === 'asc' ? <path d="M18 15l-6-6-6 6" /> : direction === 'desc' ? <path d="M6 9l6 6 6-6" /> : <path d="M7 9l5-5 5 5M7 15l5 5 5-5" />}
    </svg>
  )
}

function getCellValue<T>(row: T, column: DataTableColumn<T>): string | number {
  if (column.sortValue) return column.sortValue(row)
  const value = (row as Record<string, unknown>)[column.key]
  if (typeof value === 'number') return value
  return String(value ?? '')
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  toolbar,
  isLoading = false,
  isError = false,
  emptyMessage = '표시할 데이터가 없습니다.',
  pageSize = 10,
  onRowClick,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  const [prevData, setPrevData] = useState(data)
  if (data !== prevData) {
    setPrevData(data)
    setPage(1)
  }

  const sortedData = useMemo(() => {
    if (!sortKey) return data
    const column = columns.find((c) => c.key === sortKey)
    if (!column) return data

    return [...data].sort((a, b) => {
      const valueA = getCellValue(a, column)
      const valueB = getCellValue(b, column)
      const compared = typeof valueA === 'number' && typeof valueB === 'number' ? valueA - valueB : String(valueA).localeCompare(String(valueB), 'ko')
      return sortDir === 'asc' ? compared : -compared
    })
  }, [data, columns, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleRows = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function handleSort(column: DataTableColumn<T>) {
    if (!column.sortable) return
    if (sortKey === column.key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(column.key)
      setSortDir('asc')
    }
  }

  const alignClass: Record<'left' | 'center' | 'right', string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  return (
    <div className="rounded-lg border border-line bg-white">
      {toolbar && <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">{toolbar}</div>}

      <QueryState isLoading={isLoading} isError={isError} isEmpty={data.length === 0} emptyMessage={emptyMessage} height={240}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    style={{ width: column.width }}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted ${alignClass[column.align ?? 'left']}`}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column)}
                        className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted hover:text-ink"
                      >
                        {column.header}
                        <SortIcon direction={sortKey === column.key ? sortDir : null} />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-line last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-surface' : ''}`}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={`px-4 py-3 text-ink ${alignClass[column.align ?? 'left']}`}>
                      {column.render ? column.render(row) : getCellValue(row, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
          <span className="text-xs text-muted">총 {sortedData.length.toLocaleString()}건</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-semibold text-muted disabled:opacity-40 hover:text-ink"
            >
              이전
            </button>
            <span className="px-2 text-sm text-ink">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-semibold text-muted disabled:opacity-40 hover:text-ink"
            >
              다음
            </button>
          </div>
        </div>
      </QueryState>
    </div>
  )
}
