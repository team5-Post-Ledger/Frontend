import { useQuery } from '@tanstack/react-query'
import { getCongestionLive } from './api'

export function useCongestionLive() {
  return useQuery({
    queryKey: ['congestion', 'live'],
    queryFn: getCongestionLive,
    refetchInterval: 5000,
  })
}
