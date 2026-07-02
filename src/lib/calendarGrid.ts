export interface CalendarGridDay {
  date: string
  inCurrentMonth: boolean
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

/** 로컬 타임존 기준 오늘 날짜('YYYY-MM-DD'). `toISOString()`은 UTC라 자정~오전 9시(KST) 사이 하루 밀려 나오므로 쓰지 않는다. */
export function todayDateKey(): string {
  const now = new Date()
  return toDateKey(now.getFullYear(), now.getMonth(), now.getDate())
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** 'YYYY-MM-DD' 형식이면서 실제로 존재하는 날짜인지 확인한다(예: 2026-13-45 방지). URL 쿼리 파라미터처럼 외부에서 들어오는 날짜 문자열을 쓰기 전에 항상 거친다. */
export function isValidDateKey(value: string): boolean {
  if (!DATE_KEY_PATTERN.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

/** 월 그리드(7×N)를 구성하는 날짜 목록만 계산한다. 행사 등 도메인 데이터는 모른다. */
export function buildMonthGrid(year: number, month: number): CalendarGridDay[] {
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7

  const days: CalendarGridDay[] = []
  for (let i = 0; i < totalCells; i++) {
    const dayOffset = i - firstWeekday + 1
    const cellDate = new Date(year, month, dayOffset)
    days.push({
      date: toDateKey(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate()),
      inCurrentMonth: dayOffset >= 1 && dayOffset <= daysInMonth,
    })
  }
  return days
}
