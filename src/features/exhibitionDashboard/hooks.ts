import { useQuery } from '@tanstack/react-query'
import { getExhibitionCheckinTrend, getExhibitionOperationsSummary } from './api'

export function useExhibitionOperationsSummary(exhibitionId: number | null) {
  return useQuery({
    queryKey: ['exhibitionDashboard', 'summary', exhibitionId],
    queryFn: () => getExhibitionOperationsSummary(exhibitionId as number),
    enabled: exhibitionId !== null,
  })
}

export function useExhibitionCheckinTrend(exhibitionId: number | null) {
  return useQuery({
    queryKey: ['exhibitionDashboard', 'checkin-trend', exhibitionId],
    queryFn: () => getExhibitionCheckinTrend(exhibitionId as number),
    enabled: exhibitionId !== null,
  })
}
