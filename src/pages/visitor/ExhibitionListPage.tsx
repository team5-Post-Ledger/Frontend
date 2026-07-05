import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ExhibitionCard } from '../../components/ExhibitionCard'
import { ExhibitionFilterPanel } from '../../components/ExhibitionFilterPanel'
import { QueryState } from '../../components/QueryState'
import { QuickFilterPills } from '../../components/QuickFilterPills'
import { type DatePresetMode, computeDateRangeForPreset, isExhibitionInRange, matchesKeyword, matchesPlace } from '../../features/exhibition/dateRange'
import { type StatusFilter, matchesStatusFilter } from '../../features/exhibition/displayStatus'
import { useExhibitions } from '../../features/exhibition/hooks'
import type { ExhibitionFilterState } from '../../features/exhibition/useFilterState'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { isValidDateKey } from '../../lib/calendarGrid'

const PAGE_SIZE = 9

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
    </svg>
  )
}

function readFilterStateFromParams(params: URLSearchParams): ExhibitionFilterState {
  const dateMode = (params.get('dateMode') ?? '') as DatePresetMode | ''
  const dateFrom = params.get('dateFrom') ?? ''
  const dateTo = params.get('dateTo') ?? ''
  const hasValidRange = dateMode !== '' && isValidDateKey(dateFrom) && isValidDateKey(dateTo)

  return {
    keyword: params.get('q') ?? '',
    dateMode: hasValidRange ? dateMode : '',
    dateFrom: hasValidRange ? dateFrom : '',
    dateTo: hasValidRange ? dateTo : '',
    venue: params.get('venue') ?? '',
    status: (params.get('status') as StatusFilter | null) ?? 'ALL',
  }
}

export default function ExhibitionListPage() {
  // URL(searchParams)을 유일한 출처로 두고 로컬 state로 따로 미러링하지 않는다 — 그래야
  // "state→URL"과 "URL→state" 양방향을 항상 맞춰야 하는 동기화 문제 자체가 생기지 않는다.
  const [searchParams, setSearchParams] = useSearchParams()
  const filterState = useMemo(() => readFilterStateFromParams(searchParams), [searchParams])
  const [page, setPage] = useState(1)
  const [panelOpen, setPanelOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  function updateSearchParams(patch: Partial<ExhibitionFilterState>) {
    const next: ExhibitionFilterState = { ...filterState, ...patch }

    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (next.keyword.trim()) params.set('q', next.keyword.trim())
        else params.delete('q')

        if (next.dateMode) {
          params.set('dateMode', next.dateMode)
          params.set('dateFrom', next.dateFrom)
          params.set('dateTo', next.dateTo)
        } else {
          params.delete('dateMode')
          params.delete('dateFrom')
          params.delete('dateTo')
        }

        if (next.venue.trim()) params.set('venue', next.venue.trim())
        else params.delete('venue')

        if (next.status !== 'ALL') params.set('status', next.status)
        else params.delete('status')

        return params
      },
      { replace: true },
    )
  }

  const exhibitions = useExhibitions()

  const filtered = useMemo(() => {
    const data = exhibitions.data ?? []

    return data.filter((exhibition) => {
      if (!matchesKeyword(exhibition, filterState.keyword)) return false
      if (!matchesPlace(exhibition, filterState.venue)) return false
      if (filterState.dateMode && !isExhibitionInRange(exhibition, { from: filterState.dateFrom, to: filterState.dateTo })) return false
      if (!matchesStatusFilter(exhibition, filterState.status)) return false
      return true
    })
  }, [exhibitions.data, filterState])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visibleExhibitions = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleSearchChange(value: string) {
    setPage(1)
    updateSearchParams({ keyword: value })
  }

  function handleSelectDatePreset(mode: Exclude<DatePresetMode, 'custom'>) {
    setPage(1)
    if (filterState.dateMode === mode) {
      updateSearchParams({ dateMode: '', dateFrom: '', dateTo: '' })
      return
    }
    // 반환 키가 from/to라서 스프레드로 흘리면 dateFrom/dateTo에 매핑되지 않는다 — 반드시 명시적으로 매핑.
    const range = computeDateRangeForPreset(mode)
    updateSearchParams({ dateMode: mode, dateFrom: range.from, dateTo: range.to })
  }

  function handleSelectVenue(venue: string) {
    setPage(1)
    updateSearchParams({ venue: filterState.venue === venue ? '' : venue })
  }

  function handleApplyFilters(next: ExhibitionFilterState) {
    setPage(1)
    updateSearchParams(next)
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold tracking-tight text-ink lg:text-2xl">박람회 목록</h1>
        <p className="mt-1 text-sm text-muted">예약 가능한 박람회를 검색하고 둘러보세요.</p>
      </div>

      <div className="relative mb-6">
        <div className="flex items-center gap-2 border border-line bg-white py-2 pl-4 pr-2 shadow-sm transition-colors focus-within:border-primary">
          <span className="pointer-events-none shrink-0 text-muted">
            <SearchIcon />
          </span>
          <input
            value={filterState.keyword}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="박람회명, 지역을 검색해보세요"
            aria-label="키워드"
            className="h-[42px] w-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
          <Link
            to="/assistant"
            className="flex h-[42px] shrink-0 items-center justify-center gap-1.5 bg-primary px-3 text-sm font-bold text-white transition-colors hover:bg-primary-hover sm:px-5"
          >
            <SparkleIcon />
            AI에게 물어보기
          </Link>
        </div>

        <QuickFilterPills
          dateMode={filterState.dateMode}
          venue={filterState.venue}
          onSelectDatePreset={handleSelectDatePreset}
          onSelectVenue={handleSelectVenue}
          panelOpen={panelOpen}
          onTogglePanel={() => setPanelOpen((prev) => !prev)}
        />

        {panelOpen && (
          <ExhibitionFilterPanel
            value={filterState}
            onApply={handleApplyFilters}
            onClose={() => setPanelOpen(false)}
            onSearch={() => setPanelOpen(false)}
            variant={isDesktop ? 'dropdown' : 'sheet'}
            applyMode={isDesktop ? 'batch' : 'immediate'}
          />
        )}
      </div>

      <QueryState
        isLoading={exhibitions.isLoading}
        isError={exhibitions.isError}
        isEmpty={filtered.length === 0}
        emptyMessage="조건에 맞는 박람회가 없습니다."
        height={240}
      >
        <p className="mb-3 text-xs text-muted">총 {filtered.length.toLocaleString()}건</p>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
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
