import { useQuery } from '@tanstack/react-query'
import { getMyReport } from '../../lib/api/myReport'

export function useMyReport(reservationId: number | null) {
  return useQuery({
    queryKey: ['myReport', reservationId],
    queryFn: () => getMyReport(reservationId as number),
    enabled: reservationId !== null,
  })
}
