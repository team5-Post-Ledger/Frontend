import { useQuery } from '@tanstack/react-query'
import { getStatsSummary, getTopBooths, getVisitTrend } from './api'

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
