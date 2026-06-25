import { useQuery } from '@tanstack/react-query'
import { getBoothFlow, getStatsSummary, getTopBooths, getVisitTrend } from './api'

const EXHIBITION_ID = 1

export function useStatsSummary() {
  return useQuery({
    queryKey: ['stats', 'summary', EXHIBITION_ID],
    queryFn: getStatsSummary,
  })
}

export function useVisitTrend() {
  return useQuery({
    queryKey: ['stats', 'visit-trend', EXHIBITION_ID],
    queryFn: getVisitTrend,
  })
}

export function useTopBooths() {
  return useQuery({
    queryKey: ['stats', 'top-booths', EXHIBITION_ID],
    queryFn: getTopBooths,
  })
}

// /admin/stats(EXHIBITION_ID 하드코딩)와 달리 /admin/stats/flow는 다른 admin 화면과 동일하게
// currentExhibitionStore의 exhibitionId를 인자로 받는다(가드는 라우터의 RequireCurrentExhibition).
export function useBoothFlow(exhibitionId: number | null) {
  return useQuery({
    queryKey: ['stats', 'flow', exhibitionId],
    queryFn: () => getBoothFlow(exhibitionId as number),
    enabled: exhibitionId !== null,
  })
}
