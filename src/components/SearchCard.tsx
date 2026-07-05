import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { computeDateRangeForPreset, type DatePresetMode } from '../features/exhibition/dateRange'
import { EMPTY_FILTER_STATE, type ExhibitionFilterState } from '../features/exhibition/useFilterState'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { ExhibitionFilterPanel } from './ExhibitionFilterPanel'
import { QuickFilterPills } from './QuickFilterPills'

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function serializeFilterState(state: ExhibitionFilterState): string {
  const params = new URLSearchParams()
  if (state.keyword.trim()) params.set('q', state.keyword.trim())
  if (state.dateMode) {
    params.set('dateMode', state.dateMode)
    params.set('dateFrom', state.dateFrom)
    params.set('dateTo', state.dateTo)
  }
  if (state.venue.trim()) params.set('venue', state.venue.trim())
  if (state.status !== 'ALL') params.set('status', state.status)
  return params.toString()
}

export function SearchCard() {
  const navigate = useNavigate()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [filters, setFilters] = useState<ExhibitionFilterState>(EMPTY_FILTER_STATE)
  const [panelOpen, setPanelOpen] = useState(false)

  // 홈에서는 pill/상세필터가 조건을 쌓기만 하고, 검색 실행(이동)은 명시적 액션으로만 일어난다.
  const hasSelection = filters.dateMode !== '' || filters.venue.trim() !== '' || filters.status !== 'ALL'

  function goToExhibitions(state: ExhibitionFilterState) {
    const query = serializeFilterState(state)
    navigate(query ? `/exhibitions?${query}` : '/exhibitions')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    goToExhibitions(filters)
  }

  function handleSelectDatePreset(mode: Exclude<DatePresetMode, 'custom'>) {
    setFilters((prev) => {
      if (prev.dateMode === mode) return { ...prev, dateMode: '', dateFrom: '', dateTo: '' }
      const range = computeDateRangeForPreset(mode)
      return { ...prev, dateMode: mode, dateFrom: range.from, dateTo: range.to }
    })
  }

  function handleSelectVenue(venue: string) {
    setFilters((prev) => ({ ...prev, venue: prev.venue === venue ? '' : venue }))
  }

  function handleApplyFilters(next: ExhibitionFilterState) {
    setFilters(next)
    // 데스크톱 "필터 적용"은 명시적 실행 버튼이므로 바로 이동한다.
    // 모바일 시트(immediate)는 조건만 쌓고, 검색 실행 링크/Enter로 이동한다.
    if (isDesktop) goToExhibitions(next)
  }

  return (
    <div className="relative mx-auto w-full max-w-[720px]">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border border-primary bg-white py-2 pl-4 pr-2 transition-shadow focus-within:ring-2 focus-within:ring-primary/20"
      >
        <button type="submit" aria-label="검색" className="shrink-0 text-muted transition-colors hover:text-ink">
          <SearchIcon />
        </button>
        <input
          value={filters.keyword}
          onChange={(event) => setFilters((prev) => ({ ...prev, keyword: event.target.value }))}
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
      </form>

      <QuickFilterPills
        dateMode={filters.dateMode}
        venue={filters.venue}
        onSelectDatePreset={handleSelectDatePreset}
        onSelectVenue={handleSelectVenue}
        panelOpen={panelOpen}
        onTogglePanel={() => setPanelOpen((prev) => !prev)}
        className="lg:justify-center"
      />

      {hasSelection && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => goToExhibitions(filters)}
            className="text-xs font-bold text-primary transition-colors hover:text-primary-hover"
          >
            선택한 조건으로 검색 →
          </button>
        </div>
      )}

      {panelOpen && (
        <ExhibitionFilterPanel
          value={filters}
          onApply={handleApplyFilters}
          onClose={() => setPanelOpen(false)}
          onSearch={() => goToExhibitions(filters)}
          variant={isDesktop ? 'dropdown' : 'sheet'}
          applyMode={isDesktop ? 'batch' : 'immediate'}
        />
      )}
    </div>
  )
}
