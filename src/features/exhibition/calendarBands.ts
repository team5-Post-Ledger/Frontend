import type { Exhibition } from '../../types'
import { compareForCalendarList } from './sortForCalendar'

export const MAX_CALENDAR_LANES = 2

export type CalendarBarStatus = 'ended' | 'upcoming' | 'ongoing'

export interface CalendarWeekBar {
  exhibitionId: number
  title: string
  lane: number
  colStart: number
  colSpan: number
  roundedLeft: boolean
  roundedRight: boolean
  status: CalendarBarStatus
}

export interface CalendarWeekBands {
  bars: CalendarWeekBar[]
  lanesUsed: number
  overflowByDate: Record<string, number>
}

/** 오늘 날짜 기준으로 이 전시가 이미 끝났는지/아직 시작 전인지/지금 진행중인지. 막대 전체에 하나의 색으로 적용된다. */
function getBarStatus(exhibition: Pick<Exhibition, 'startDate' | 'endDate'>, today: string): CalendarBarStatus {
  if (today > exhibition.endDate) return 'ended'
  if (today < exhibition.startDate) return 'upcoming'
  return 'ongoing'
}

/** 이번 주(7일) 범위 안에서 전시가 실제로 보이는 구간 (전체 기간이 주 경계를 넘어가면 이번 주 안으로 잘라낸다). */
function presenceRangeInWeek(exhibition: Exhibition, weekStart: string, weekEnd: string): [string, string] {
  return [
    exhibition.startDate < weekStart ? weekStart : exhibition.startDate,
    exhibition.endDate > weekEnd ? weekEnd : exhibition.endDate,
  ]
}

/**
 * 한 주 안에서 겹치지 않는 전시끼리 같은 lane을 재사용한다(구간 스케줄링의 lane 배정과 동일).
 * 같은 전시는 그 주 안에서 항상 하나의 lane을 유지하므로, 막대를 grid-column span 하나로 그리면 요일 사이에 끊김이 생기지 않는다.
 */
function assignLanesForWeek(weekStart: string, weekEnd: string, exhibitions: Exhibition[]): Map<number, number> {
  const laneAssignment = new Map<number, number>()
  const laneLastEnd: string[] = []

  const active = exhibitions
    .filter((exhibition) => exhibition.startDate <= weekEnd && exhibition.endDate >= weekStart)
    .sort(compareForCalendarList)

  for (const exhibition of active) {
    const [presenceStart, presenceEnd] = presenceRangeInWeek(exhibition, weekStart, weekEnd)
    let lane = laneLastEnd.findIndex((lastEnd) => lastEnd < presenceStart)
    if (lane === -1) lane = laneLastEnd.length
    laneLastEnd[lane] = presenceEnd
    laneAssignment.set(exhibition.id, lane)
  }

  return laneAssignment
}

/** 달력 한 주(연속된 7일)에 대해 요일을 가로지르는 막대 목록과 lane 사용량, 초과분을 계산한다. */
export function buildCalendarWeekBands(weekDates: string[], exhibitions: Exhibition[], today: string): CalendarWeekBands {
  const weekStart = weekDates[0]
  const weekEnd = weekDates[weekDates.length - 1]
  const laneAssignment = assignLanesForWeek(weekStart, weekEnd, exhibitions)

  const active = exhibitions
    .filter((exhibition) => exhibition.startDate <= weekEnd && exhibition.endDate >= weekStart)
    .sort(compareForCalendarList)

  const bars: CalendarWeekBar[] = []
  const overflowByDate: Record<string, number> = {}
  let lanesUsed = 0

  for (const exhibition of active) {
    const lane = laneAssignment.get(exhibition.id) as number
    const [presenceStart, presenceEnd] = presenceRangeInWeek(exhibition, weekStart, weekEnd)
    const colStart = weekDates.indexOf(presenceStart)
    const colEnd = weekDates.indexOf(presenceEnd)

    if (lane >= MAX_CALENDAR_LANES) {
      for (let i = colStart; i <= colEnd; i++) {
        const date = weekDates[i]
        overflowByDate[date] = (overflowByDate[date] ?? 0) + 1
      }
      continue
    }

    lanesUsed = Math.max(lanesUsed, lane + 1)

    bars.push({
      exhibitionId: exhibition.id,
      title: exhibition.title,
      lane,
      colStart,
      colSpan: colEnd - colStart + 1,
      roundedLeft: presenceStart === exhibition.startDate,
      roundedRight: presenceEnd === exhibition.endDate,
      status: getBarStatus(exhibition, today),
    })
  }

  return { bars, lanesUsed, overflowByDate }
}
