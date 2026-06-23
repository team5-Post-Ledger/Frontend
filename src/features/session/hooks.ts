import { useQuery } from '@tanstack/react-query'
import { getSessions } from '../../lib/api/sessions'

export function useSessions(exhibitionId: number | null) {
  return useQuery({
    queryKey: ['sessions', exhibitionId],
    queryFn: () => getSessions(exhibitionId as number),
    enabled: exhibitionId !== null,
  })
}
