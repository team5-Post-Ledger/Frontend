import { useQuery } from '@tanstack/react-query'
import { getReservations } from '../../lib/api/reservations'

export function useReservations() {
  return useQuery({
    queryKey: ['reservations', 'list'],
    queryFn: getReservations,
  })
}
