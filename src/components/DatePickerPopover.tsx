import type { MouseEvent as ReactMouseEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { buildMonthGrid, isValidDateKey, todayDateKey } from '../lib/calendarGrid'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function parseYearMonth(value: string): { year: number; month: number } {
  if (value && isValidDateKey(value)) {
    const [year, month] = value.split('-').map(Number)
    return { year, month: month - 1 }
  }
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

function formatShortDate(value: string): string {
  const [, month, day] = value.split('-').map(Number)
  return `${month}월 ${day}일`
}

export function DatePickerPopover({
  value,
  onChange,
  placeholder = '날짜 선택',
  bare = false,
}: {
  value: string
  onChange: (date: string) => void
  placeholder?: string
  /** 세그먼트 바 등 이미 테두리가 있는 컨테이너 안에 끼워넣을 때 트리거 자체 테두리를 없앤다. */
  bare?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => parseYearMonth(value))
  const containerRef = useRef<HTMLDivElement>(null)
  const today = todayDateKey()

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

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev
      if (next) setViewMonth(parseYearMonth(value))
      return next
    })
  }

  function handleSelect(date: string) {
    onChange(date)
    setOpen(false)
  }

  function handleClear(event: ReactMouseEvent) {
    event.stopPropagation()
    onChange('')
    setOpen(false)
  }

  function goToPrevMonth() {
    setViewMonth((prev) => (prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 }))
  }

  function goToNextMonth() {
    setViewMonth((prev) => (prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 }))
  }

  const days = buildMonthGrid(viewMonth.year, viewMonth.month)
  const hasValidValue = value !== '' && isValidDateKey(value)

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={hasValidValue ? `${placeholder}: ${formatShortDate(value)}` : placeholder}
        className={`flex h-[42px] w-full items-center px-3.5 pr-8 text-left text-sm outline-none transition-colors active:bg-surface focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 ${
          bare ? `bg-transparent ${open ? 'bg-surface' : ''}` : `border bg-white ${open ? 'border-primary' : 'border-line'}`
        } ${value ? 'text-ink' : 'text-muted'}`}
      >
        <span className="truncate" aria-hidden="true">{hasValidValue ? formatShortDate(value) : placeholder}</span>
      </button>

      {value ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="날짜 지우기"
          className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          ×
        </button>
      ) : (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">▾</span>
      )}

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-20 w-[280px] border border-line bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={goToPrevMonth}
              aria-label="이전 달"
              className="flex h-7 w-7 items-center justify-center text-muted outline-none transition-colors hover:text-ink active:bg-surface focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              ◀
            </button>
            <div className="text-xs font-bold text-ink">
              {viewMonth.year}년 {viewMonth.month + 1}월
            </div>
            <button
              type="button"
              onClick={goToNextMonth}
              aria-label="다음 달"
              className="flex h-7 w-7 items-center justify-center text-muted outline-none transition-colors hover:text-ink active:bg-surface focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              ▶
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="pb-1 text-center text-[10px] font-semibold text-muted">
                {label}
              </div>
            ))}
            {days.map((day) => {
              const isSelected = day.date === value
              const isToday = day.date === today

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => handleSelect(day.date)}
                  aria-label={formatShortDate(day.date)}
                  aria-current={isToday ? 'date' : undefined}
                  aria-pressed={isSelected}
                  className="flex items-center justify-center py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors active:bg-primary/20 ${
                      isSelected
                        ? 'bg-primary font-bold text-white'
                        : !day.inCurrentMonth
                          ? 'text-muted/40 hover:bg-surface'
                          : isToday
                            ? 'font-bold text-primary hover:bg-surface'
                            : 'text-ink hover:bg-surface'
                    }`}
                  >
                    {Number(day.date.slice(-2))}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
