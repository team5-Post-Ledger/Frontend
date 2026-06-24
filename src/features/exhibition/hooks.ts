import { useQuery } from '@tanstack/react-query'
import { getExhibition, getExhibitions, getRecommendedExhibitions } from '../../lib/api/exhibitions'

const CURRENT_EXHIBITION_ID = 1

export function useCurrentExhibition() {
  return useQuery({
    queryKey: ['exhibition', 'current', CURRENT_EXHIBITION_ID],
    queryFn: () => getExhibition(CURRENT_EXHIBITION_ID),
  })
}

export function useRecommendedExhibitions() {
  return useQuery({
    queryKey: ['exhibition', 'recommended'],
    queryFn: getRecommendedExhibitions,
  })
}

export function useExhibitions() {
  return useQuery({
    queryKey: ['exhibition', 'list'],
    queryFn: getExhibitions,
  })
}

export function useExhibition(id: number | null) {
  return useQuery({
    queryKey: ['exhibition', id],
    queryFn: () => getExhibition(id as number),
    enabled: id !== null,
  })
}
