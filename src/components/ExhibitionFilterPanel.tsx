import { useEffect, useRef, useState } from 'react'
import { type DatePresetMode, computeDateRangeForPreset } from '../features/exhibition/dateRange'
import type { StatusFilter } from '../features/exhibition/displayStatus'
import { DATE_PRESET_OPTIONS, STATUS_FILTER_OPTIONS } from '../features/exhibition/filterConstants'
import { type ExhibitionFilterState, useExhibitionFilterState } from '../features/exhibition/useFilterState'
import { DatePickerPopover } from './DatePickerPopover'
import { fieldControlClass } from './Field'

const DATE_PRESET_LABELS: Record<DatePresetMode, string> = {
  today: '오늘',
  weekend: '이번 주말',
  nextWeek: '다음 주',
  custom: '',
}

function pillClass(active: boolean) {
  return `rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
    active ? 'border-primary bg-primary text-white' : 'border-line bg-white text-muted hover:text-ink'
  }`
}

function buildSummaryText(state: ExhibitionFilterState): string {
  const parts: string[] = []
  if (state.dateMode === 'custom' && state.dateFrom) {
    parts.push(state.dateFrom)
  } else if (state.dateMode) {
    parts.push(DATE_PRESET_LABELS[state.dateMode])
  }
  if (state.venue.trim()) parts.push(state.venue.trim())
  if (state.status !== 'ALL') {
    parts.push(STATUS_FILTER_OPTIONS.find((option) => option.value === state.status)?.label ?? '')
  }
  return parts.filter(Boolean).join(' + ')
}

export function ExhibitionFilterPanel({
  value,
  onApply,
  onClose,
  onSearch,
  variant,
  applyMode,
}: {
  value: ExhibitionFilterState
  onApply: (next: ExhibitionFilterState) => void
  onClose: () => void
  onSearch: () => void
  variant: 'dropdown' | 'sheet'
  applyMode: 'batch' | 'immediate'
}) {
  const { draft, setDraft, reset } = useExhibitionFilterState(value)
  const [showCustomCalendar, setShowCustomCalendar] = useState(draft.dateMode === 'custom')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (variant !== 'dropdown') return

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [variant, onClose])

  function commit(next: ExhibitionFilterState) {
    setDraft(next)
    if (applyMode === 'immediate') onApply(next)
  }

  function handleDatePreset(mode: Exclude<DatePresetMode, 'custom'>) {
    setShowCustomCalendar(false)
    const range = computeDateRangeForPreset(mode)
    commit({ ...draft, dateMode: mode, dateFrom: range.from, dateTo: range.to })
  }

  function handleCustomDate(date: string) {
    commit(
      date
        ? { ...draft, dateMode: 'custom', dateFrom: date, dateTo: date }
        : { ...draft, dateMode: '', dateFrom: '', dateTo: '' },
    )
  }

  function handleVenueChange(venue: string) {
    commit({ ...draft, venue })
  }

  function handleStatusChange(status: StatusFilter) {
    commit({ ...draft, status })
  }

  function handleReset() {
    reset()
    setShowCustomCalendar(false)
  }

  function handleApply() {
    onApply(draft)
    onClose()
  }

  function handleSearchClick() {
    onSearch()
    onClose()
  }

  const summary = buildSummaryText(draft)

  const content = (
    <div ref={containerRef} className={variant === 'dropdown' ? 'border border-line bg-white p-5 shadow-sm' : 'p-5'}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-ink">상세필터</p>
          {summary && <p className="mt-0.5 text-xs text-muted">현재 조건: {summary}</p>}
        </div>
        {applyMode === 'immediate' && (
          <button
            type="button"
            onClick={handleSearchClick}
            className="flex h-9 shrink-0 items-center justify-center gap-1.5 bg-primary px-4 text-xs font-bold text-white transition-colors hover:bg-primary-hover"
          >
            선택 조건으로 검색
          </button>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold text-muted">관람일</p>
          <div className="flex flex-wrap justify-center gap-2">
            {DATE_PRESET_OPTIONS.map((preset) => (
              <button
                key={preset.mode}
                type="button"
                onClick={() => handleDatePreset(preset.mode)}
                aria-pressed={draft.dateMode === preset.mode}
                className={pillClass(draft.dateMode === preset.mode)}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowCustomCalendar((prev) => !prev)}
              aria-pressed={draft.dateMode === 'custom'}
              className={pillClass(draft.dateMode === 'custom')}
            >
              날짜 직접 선택
            </button>
          </div>
          {showCustomCalendar && (
            <div className="mt-3">
              <DatePickerPopover value={draft.dateFrom} onChange={handleCustomDate} placeholder="날짜 선택" />
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-muted">장소</p>
          <input
            value={draft.venue}
            onChange={(event) => handleVenueChange(event.target.value)}
            placeholder="장소(지역, 전시장명)"
            aria-label="장소"
            className={fieldControlClass}
          />
        </div>

        <div className="lg:col-span-2">
          <p className="mb-2 text-xs font-semibold text-muted">상태</p>
          <div className="flex flex-wrap justify-center gap-2">
            {STATUS_FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleStatusChange(option.value)}
                aria-pressed={draft.status === option.value}
                className={pillClass(draft.status === option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {applyMode === 'batch' && (
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-line pt-4">
          <button type="button" onClick={handleReset} className="px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-ink">
            초기화
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="bg-primary px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
          >
            선택 조건으로 검색
          </button>
        </div>
      )}
    </div>
  )

  if (variant === 'dropdown') {
    return <div className="absolute inset-x-0 top-full z-20 mt-2">{content}</div>
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 bottom-16 z-30 bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-16 z-40 max-h-[70vh] overflow-y-auto border-t border-line bg-white">
        <div className="mx-auto mt-2 h-1 w-10 bg-line" aria-hidden="true" />
        {content}
      </div>
    </>
  )
}
