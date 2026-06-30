import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ExhibitionCard } from '../../components/ExhibitionCard'
import { fieldControlClass } from '../../components/Field'
import { QueryState } from '../../components/QueryState'
import { getExhibitionDisplayStatus } from '../../features/exhibition/displayStatus'
import { useExhibitions } from '../../features/exhibition/hooks'
import type { Exhibition } from '../../types'

type StatusFilter = 'ALL' | 'ONGOING' | 'UPCOMING'

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: '상태 전체' },
  { value: 'ONGOING', label: '진행중' },
  { value: 'UPCOMING', label: '예약중' },
]

const PAGE_SIZE = 9

function matchesStatusFilter(exhibition: Exhibition, filter: StatusFilter): boolean {
  if (filter === 'ALL') return true
  const displayLabel = getExhibitionDisplayStatus(exhibition).label
  return filter === 'ONGOING' ? displayLabel === '진행중' : displayLabel === '예약중'
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  )
}

export default function ExhibitionListPage() {
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') ?? '')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [page, setPage] = useState(1)

  const exhibitions = useExhibitions()

  const filtered = useMemo(() => {
    const data = exhibitions.data ?? []
    const term = searchTerm.trim().toLowerCase()

    return data.filter((exhibition) => {
      if (term && !exhibition.title.toLowerCase().includes(term)) return false
      if (!matchesStatusFilter(exhibition, statusFilter)) return false
      return true
    })
  }, [exhibitions.data, searchTerm, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visibleExhibitions = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleSearchChange(value: string) {
    setSearchTerm(value)
    setPage(1)
  }

  function handleStatusChange(value: StatusFilter) {
    setStatusFilter(value)
    setPage(1)
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold tracking-tight text-ink lg:text-2xl">박람회 목록</h1>
        <p className="mt-1 text-sm text-muted">예약 가능한 박람회를 검색하고 둘러보세요.</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:w-[280px]">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
            <SearchIcon />
          </span>
          <input
            value={searchTerm}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="박람회 이름으로 검색"
            className={`${fieldControlClass} pl-9`}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => handleStatusChange(event.target.value as StatusFilter)}
          className="h-[42px] border border-line bg-white px-3 text-sm text-ink outline-none focus:border-primary"
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <QueryState
        isLoading={exhibitions.isLoading}
        isError={exhibitions.isError}
        isEmpty={filtered.length === 0}
        emptyMessage="조건에 맞는 박람회가 없습니다."
        height={240}
      >
        <p className="mb-3 text-xs text-muted">총 {filtered.length.toLocaleString()}건</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleExhibitions.map((exhibition) => (
            <ExhibitionCard key={exhibition.id} exhibition={exhibition} />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink disabled:opacity-40"
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
            className="px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink disabled:opacity-40"
          >
            다음
          </button>
        </div>
      </QueryState>
    </div>
  )
}
