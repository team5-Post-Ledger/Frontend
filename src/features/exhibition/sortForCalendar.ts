import type { Exhibition } from '../../types'

export function compareForCalendarList(a: Exhibition, b: Exhibition): number {
  if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate)
  if (a.endDate !== b.endDate) return a.endDate.localeCompare(b.endDate)
  return a.title.localeCompare(b.title, 'ko')
}
