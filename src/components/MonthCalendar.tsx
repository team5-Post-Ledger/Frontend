import { useMemo, useState } from 'react'
import { buildCalendarWeekBands, type CalendarBarStatus, type CalendarWeekBands } from '../features/exhibition/calendarBands'
import { buildMonthGrid, todayDateKey, type CalendarGridDay } from '../lib/calendarGrid'
import type { Exhibition } from '../types'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const NUMBER_ROW_HEIGHT = 32
const LANE_ROW_HEIGHT = 15

interface CalendarWeek {
  days: CalendarGridDay[]
  bands: CalendarWeekBands
}

function buildCalendarWeeks(year: number, month: number, exhibitions: Exhibition[], today: string): CalendarWeek[] {
  const grid = buildMonthGrid(year, month)
  const weeks: CalendarWeek[] = []

  for (let i = 0; i < grid.length; i += 7) {
    const days = grid.slice(i, i + 7)
    const bands = buildCalendarWeekBands(
      days.map((day) => day.date),
      exhibitions,
      today,
    )
    weeks.push({ days, bands })
  }

  return weeks
}

function barColorClassName(status: CalendarBarStatus): string {
  if (status === 'ended') return 'bg-warning text-ink'
  if (status === 'upcoming') return 'bg-primary text-white'
  return 'bg-live text-ink'
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

  const weeks = useMemo(
    () => buildCalendarWeeks(viewMonth.year, viewMonth.month, exhibitions, today),
    [viewMonth, exhibitions, today],
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

      <div className="flex flex-col gap-1">
        {weeks.map(({ days, bands }) => {
          const fixedRowHeights = [NUMBER_ROW_HEIGHT, ...Array(bands.lanesUsed).fill(LANE_ROW_HEIGHT)]
          // 고정 행(숫자·막대) 다음에 남는 세로 공간은 유동 행이 흡수한다 — 겹침이 없는 주는
          // min-h(원래 셀 높이)에 딱 맞고, 겹침이 있는 주만 고정 행 합만큼 자연스럽게 커진다.
          const rowCount = fixedRowHeights.length + 1

          return (
            <div
              key={days[0].date}
              className="grid grid-cols-7 min-h-[64px] sm:min-h-[76px]"
              style={{ gridTemplateRows: `${fixedRowHeights.map((h) => `${h}px`).join(' ')} minmax(0, 1fr)` }}
            >
              {days.map((day, dayIndex) => {
                const isSelected = day.date === selectedDate
                const isToday = day.date === today
                const hasOverflow = (bands.overflowByDate[day.date] ?? 0) > 0

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => onSelectDate(day.date)}
                    style={{ gridColumn: dayIndex + 1, gridRow: `1 / span ${rowCount}` }}
                    className="flex flex-col items-start text-left transition-colors hover:bg-surface active:bg-surface"
                  >
                    <span
                      className={`relative m-1.5 flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        isSelected
                          ? 'bg-primary font-bold text-white'
                          : !day.inCurrentMonth
                            ? 'text-muted/50'
                            : isToday
                              ? 'font-bold text-primary'
                              : 'text-ink'
                      }`}
                    >
                      {Number(day.date.slice(-2))}
                      {hasOverflow && <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-muted" />}
                    </span>
                  </button>
                )
              })}

              {bands.bars.map((bar) => (
                <div
                  key={bar.exhibitionId}
                  style={{ gridColumn: `${bar.colStart + 1} / span ${bar.colSpan}`, gridRow: bar.lane + 2 }}
                  className={`pointer-events-none mx-1.5 flex items-center truncate px-1.5 text-[9px] font-bold leading-[15px] ${barColorClassName(bar.status)} ${
                    bar.roundedLeft ? 'rounded-l-full' : ''
                  } ${bar.roundedRight ? 'rounded-r-full' : ''}`}
                >
                  {bar.title}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
