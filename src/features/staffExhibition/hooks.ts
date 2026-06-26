import { useQuery } from '@tanstack/react-query'
import { getMyProgress, getMyStaffExhibitions } from '../../lib/api/staffExhibitions'

export function useMyStaffExhibitions() {
  return useQuery({
    queryKey: ['staffExhibitions', 'my'],
    queryFn: getMyStaffExhibitions,
  })
}

export function useMyProgress(exhibitionId: number | null) {
  return useQuery({
    queryKey: ['staffExhibitions', 'progress', exhibitionId],
    queryFn: () => getMyProgress(exhibitionId as number),
    enabled: exhibitionId !== null,
  })
}
