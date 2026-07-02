import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { DatePickerPopover } from '../../components/DatePickerPopover'
import { ExhibitionCard } from '../../components/ExhibitionCard'
import { QueryState } from '../../components/QueryState'
import { isExhibitionOnDate, matchesPlace } from '../../features/exhibition/dateRange'
import { getExhibitionDisplayStatus } from '../../features/exhibition/displayStatus'
import { useExhibitions } from '../../features/exhibition/hooks'
import { isValidDateKey } from '../../lib/calendarGrid'
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
  // URL(searchParams)을 유일한 출처로 두고 로컬 state로 따로 미러링하지 않는다 — 그래야
  // "state→URL"과 "URL→state" 양방향을 항상 맞춰야 하는 동기화 문제 자체가 생기지 않는다.
  const [searchParams, setSearchParams] = useSearchParams()
  const searchTerm = searchParams.get('q') ?? ''
  const dateFilter = searchParams.get('date') ?? ''
  const venueFilter = searchParams.get('venue') ?? ''
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [page, setPage] = useState(1)

  function updateSearchParams(next: { q?: string; date?: string; venue?: string }) {
    const q = next.q ?? searchTerm
    const date = next.date ?? dateFilter
    const venue = next.venue ?? venueFilter

    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (q.trim()) params.set('q', q.trim())
        else params.delete('q')
        if (date) params.set('date', date)
        else params.delete('date')
        if (venue.trim()) params.set('venue', venue.trim())
        else params.delete('venue')
        return params
      },
      { replace: true },
    )
  }

  const exhibitions = useExhibitions()

  const filtered = useMemo(() => {
    const data = exhibitions.data ?? []
    const term = searchTerm.trim().toLowerCase()
    // 형식이 깨진 date 쿼리 파라미터(예: ?date=hello)는 날짜 필터를 무시한 것으로 취급한다.
    // 검증 없이 그대로 문자열 비교하면 전부 걸러져 결과가 조용히 0건이 돼버린다.
    const hasValidDateFilter = dateFilter !== '' && isValidDateKey(dateFilter)

    return data.filter((exhibition) => {
      if (term && !exhibition.title.toLowerCase().includes(term)) return false
      if (!matchesStatusFilter(exhibition, statusFilter)) return false
      if (hasValidDateFilter && !isExhibitionOnDate(exhibition, dateFilter)) return false
      if (!matchesPlace(exhibition, venueFilter)) return false
      return true
    })
  }, [exhibitions.data, searchTerm, statusFilter, dateFilter, venueFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visibleExhibitions = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleSearchChange(value: string) {
    setPage(1)
    updateSearchParams({ q: value })
  }

  function handleStatusChange(value: StatusFilter) {
    setStatusFilter(value)
    setPage(1)
  }

  function handleDateChange(value: string) {
    setPage(1)
    updateSearchParams({ date: value })
  }

  function handleVenueChange(value: string) {
    setPage(1)
    updateSearchParams({ venue: value })
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold tracking-tight text-ink lg:text-2xl">박람회 목록</h1>
        <p className="mt-1 text-sm text-muted">예약 가능한 박람회를 검색하고 둘러보세요.</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="grid grid-cols-2 border border-line bg-white shadow-sm lg:flex-1 lg:grid-cols-[7fr_1.5fr_1.5fr]">
          <div className="relative col-span-2 border-b border-line lg:col-span-1 lg:border-b-0 lg:border-r">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
              <SearchIcon />
            </span>
            <input
              value={searchTerm}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="박람회 이름으로 검색"
              className="h-[42px] w-full bg-transparent pl-9 pr-3 text-sm text-ink outline-none focus:bg-surface focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
            />
          </div>

          <div className="border-r border-line">
            <DatePickerPopover value={dateFilter} onChange={handleDateChange} placeholder="관람일" bare />
          </div>

          <input
            value={venueFilter}
            onChange={(event) => handleVenueChange(event.target.value)}
            placeholder="장소(지역, 전시장명)"
            aria-label="장소"
            className="h-[42px] w-full bg-transparent px-3.5 text-sm text-ink outline-none focus:bg-surface focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => handleStatusChange(event.target.value as StatusFilter)}
          className="h-[42px] w-full border border-line bg-white px-3 text-sm text-ink outline-none focus:border-primary lg:w-auto"
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
            className="px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink active:bg-surface disabled:opacity-40"
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
            className="px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink active:bg-surface disabled:opacity-40"
          >
            다음
          </button>
        </div>
      </QueryState>
    </div>
  )
}
