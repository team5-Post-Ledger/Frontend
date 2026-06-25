import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createRecommendedRoute,
  getMyRecommendedRoutes,
  getRecommendedRoute,
  type CreateRecommendedRouteInput,
} from '../../lib/api/recommendedRoutes'

export function useRecommendedRoute(routeId: number | null) {
  return useQuery({
    queryKey: ['recommendedRoute', routeId],
    queryFn: () => getRecommendedRoute(routeId as number),
    enabled: routeId !== null,
  })
}

export function useMyRecommendedRoutes(exhibitionId?: number) {
  return useQuery({
    queryKey: ['recommendedRoute', 'me', exhibitionId ?? null],
    queryFn: () => getMyRecommendedRoutes(exhibitionId),
  })
}

export function useCreateRecommendedRoute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateRecommendedRouteInput) => createRecommendedRoute(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendedRoute', 'me'] })
    },
  })
}
