import { toDateKey, todayDateKey } from '../../lib/calendarGrid'
import type { Exhibition } from '../../types'

// 홈 "일정 탐색" 달력(ScheduleSection)이 여전히 하루 단위로 쓴다 — 검색바/상세필터는 아래
// isExhibitionInRange(기간 개념)를 대신 쓰고, 이 함수는 그대로 유지한다.
export function isExhibitionOnDate(exhibition: Pick<Exhibition, 'startDate' | 'endDate'>, date: string): boolean {
  return exhibition.startDate <= date && date <= exhibition.endDate
}

export function matchesPlace(exhibition: Pick<Exhibition, 'venue' | 'address'>, term: string): boolean {
  const t = term.trim().toLowerCase()
  if (!t) return true
  return exhibition.venue.toLowerCase().includes(t) || exhibition.address.toLowerCase().includes(t)
}

/** 검색바 통합 키워드 인풋용 — 제목/장소/주소를 한 번에 넓게 매칭한다. */
export function matchesKeyword(exhibition: Pick<Exhibition, 'title' | 'venue' | 'address'>, term: string): boolean {
  const t = term.trim().toLowerCase()
  if (!t) return true
  return (
    exhibition.title.toLowerCase().includes(t) ||
    exhibition.venue.toLowerCase().includes(t) ||
    exhibition.address.toLowerCase().includes(t)
  )
}

/** 검색바/상세필터의 관람일 기간(range) 겹침 판정. */
export function isExhibitionInRange(
  exhibition: Pick<Exhibition, 'startDate' | 'endDate'>,
  range: { from: string; to: string },
): boolean {
  return exhibition.startDate <= range.to && range.from <= exhibition.endDate
}

export type DatePresetMode = 'today' | 'weekend' | 'nextWeek' | 'custom'

function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day + days)
  return toDateKey(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * 오늘/이번 주말/다음 주 프리셋 → 실제 날짜 범위.
 * 이번 주말: 토요일이면 오늘~내일, 일요일이면 오늘 하루, 평일이면 돌아오는 토·일.
 * 다음 주: 오늘 요일과 무관하게 항상 다음 주 월~일 전체.
 */
export function computeDateRangeForPreset(
  mode: Exclude<DatePresetMode, 'custom'>,
  today: string = todayDateKey(),
): { from: string; to: string } {
  const dow = new Date(`${today}T00:00:00`).getDay() // 0=일 ... 6=토

  if (mode === 'today') {
    return { from: today, to: today }
  }

  if (mode === 'weekend') {
    if (dow === 6) return { from: today, to: addDays(today, 1) }
    if (dow === 0) return { from: today, to: today }
    const thisMonday = addDays(today, -((dow + 6) % 7))
    return { from: addDays(thisMonday, 5), to: addDays(thisMonday, 6) }
  }

  const thisMonday = addDays(today, -((dow + 6) % 7))
  const nextMonday = addDays(thisMonday, 7)
  return { from: nextMonday, to: addDays(nextMonday, 6) }
}
