import type { Exhibition } from '../../types'
import { getExhibitionDisplayStatus } from './displayStatus'

export function compareForBanner(a: Exhibition, b: Exhibition): number {
  const aOngoing = getExhibitionDisplayStatus(a).label === '진행중'
  const bOngoing = getExhibitionDisplayStatus(b).label === '진행중'
  if (aOngoing !== bOngoing) return aOngoing ? -1 : 1
  if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate)
  return a.title.localeCompare(b.title, 'ko')
}
