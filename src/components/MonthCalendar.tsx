import { useMemo, useState } from 'react'
import { buildMonthGrid, todayDateKey } from '../lib/calendarGrid'
import { isExhibitionOnDate } from '../features/exhibition/dateRange'
import { compareForCalendarList } from '../features/exhibition/sortForCalendar'
import type { Exhibition } from '../types'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

interface CalendarCellData {
  date: string
  inCurrentMonth: boolean
  exhibitionsOnDate: Exhibition[]
  primary: Exhibition | null
  extraCount: number
}

function buildCalendarCells(year: number, month: number, exhibitions: Exhibition[]): CalendarCellData[] {
  return buildMonthGrid(year, month).map((day) => {
    const exhibitionsOnDate = exhibitions
      .filter((exhibition) => isExhibitionOnDate(exhibition, day.date))
      .sort(compareForCalendarList)

    return {
      date: day.date,
      inCurrentMonth: day.inCurrentMonth,
      exhibitionsOnDate,
      primary: exhibitionsOnDate[0] ?? null,
      extraCount: Math.max(0, exhibitionsOnDate.length - 1),
    }
  })
}

export function MonthCalendar({
  exhibitions,
  selectedDate,
  onSelectDate,
}: {
  exhibitions: Exhibition[]
  selectedDate: string
  onSelectDate: (date: string) => void
}) {
  const today = useMemo(() => todayDateKey(), [])
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const cells = useMemo(
    () => buildCalendarCells(viewMonth.year, viewMonth.month, exhibitions),
    [viewMonth, exhibitions],
  )

  function goToPrevMonth() {
    setViewMonth((prev) => (prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 }))
  }

  function goToNextMonth() {
    setViewMonth((prev) => (prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 }))
  }

  return (
    <div className="border border-line bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={goToPrevMonth}
          aria-label="이전 달"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-white active:bg-primary"
        >
          ◀
        </button>
        <div className="text-sm font-bold text-ink">
          {viewMonth.year}년 {viewMonth.month + 1}월
        </div>
        <button
          type="button"
          onClick={goToNextMonth}
          aria-label="다음 달"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-white active:bg-primary"
        >
          ▶
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-line pb-1.5">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="text-center text-[11px] font-semibold text-muted">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((cell) => {
          const isSelected = cell.date === selectedDate
          const isToday = cell.date === today

          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelectDate(cell.date)}
              className="flex min-h-[64px] flex-col items-start gap-0.5 p-1.5 text-left transition-colors hover:bg-surface active:bg-surface sm:min-h-[76px]"
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isSelected
                    ? 'bg-primary font-bold text-white'
                    : !cell.inCurrentMonth
                      ? 'text-muted/50'
                      : isToday
                        ? 'font-bold text-primary'
                        : 'text-ink'
                }`}
              >
                {Number(cell.date.slice(-2))}
              </span>
              {cell.primary && (
                <span className="w-full line-clamp-1 text-[11px] leading-tight text-ink">{cell.primary.title}</span>
              )}
              {cell.extraCount > 0 && <span className="text-[10px] text-muted">외 {cell.extraCount}건</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
