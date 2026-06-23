import { useQuery } from '@tanstack/react-query'
import { getExhibitors } from '../../lib/api/exhibitors'

export function useExhibitors() {
  return useQuery({
    queryKey: ['exhibitors', 'list'],
    queryFn: getExhibitors,
  })
}
