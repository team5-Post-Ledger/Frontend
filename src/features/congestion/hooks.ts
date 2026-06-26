import { useQuery } from '@tanstack/react-query'
import { getCongestionLive } from './api'

export function useCongestionLive(exhibitionId?: number | null) {
  return useQuery({
    queryKey: ['congestion', 'live', exhibitionId ?? 'all'],
    queryFn: () => getCongestionLive(exhibitionId ?? undefined),
    refetchInterval: 5000,
  })
}
