import { useQuery } from '@tanstack/react-query'
import { getRecentCheckins } from '../../lib/api/checkin'

export function useRecentCheckins() {
  return useQuery({
    queryKey: ['checkin', 'recent'],
    queryFn: getRecentCheckins,
  })
}
