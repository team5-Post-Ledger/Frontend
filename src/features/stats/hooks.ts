import { useQuery } from '@tanstack/react-query'
import { getBoothFlow, getStatsSummary, getTopBooths, getVisitTrend } from './api'

export function useStatsSummary(exhibitionId: number | null) {
  return useQuery({
    queryKey: ['stats', 'summary', exhibitionId],
    queryFn: () => getStatsSummary(exhibitionId as number),
    enabled: exhibitionId !== null,
  })
}

export function useVisitTrend(exhibitionId: number | null) {
  return useQuery({
    queryKey: ['stats', 'visit-trend', exhibitionId],
    queryFn: () => getVisitTrend(exhibitionId as number),
    enabled: exhibitionId !== null,
  })
}

export function useTopBooths(exhibitionId: number | null) {
  return useQuery({
    queryKey: ['stats', 'top-booths', exhibitionId],
    queryFn: () => getTopBooths(exhibitionId as number),
    enabled: exhibitionId !== null,
  })
}

// /admin/stats/flow도 다른 admin 화면과 동일하게 currentExhibitionStore의 exhibitionId를 인자로 받는다.
// 가드는 라우터의 RequireCurrentExhibition에서 처리한다.
export function useBoothFlow(exhibitionId: number | null) {
  return useQuery({
    queryKey: ['stats', 'flow', exhibitionId],
    queryFn: () => getBoothFlow(exhibitionId as number),
    enabled: exhibitionId !== null,
  })
}
