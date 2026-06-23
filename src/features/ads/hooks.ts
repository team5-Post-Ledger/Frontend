import { useQuery } from '@tanstack/react-query'
import { getActiveAds } from '../../lib/api/ads'

export function useActiveAds() {
  return useQuery({
    queryKey: ['ads', 'active'],
    queryFn: getActiveAds,
  })
}
