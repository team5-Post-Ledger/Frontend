import type { Exhibition } from '../../types'

export function isExhibitionOnDate(exhibition: Pick<Exhibition, 'startDate' | 'endDate'>, date: string): boolean {
  return exhibition.startDate <= date && date <= exhibition.endDate
}

export function matchesPlace(exhibition: Pick<Exhibition, 'venue' | 'address'>, term: string): boolean {
  const t = term.trim().toLowerCase()
  if (!t) return true
  return exhibition.venue.toLowerCase().includes(t) || exhibition.address.toLowerCase().includes(t)
}
