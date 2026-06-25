import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getReservations, payReservationOnsite } from '../../lib/api/reservations'

export function useReservations() {
  return useQuery({
    queryKey: ['reservations', 'list'],
    queryFn: getReservations,
  })
}

export function usePayReservationOnsite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reservationId: number) => payReservationOnsite(reservationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
  })
}
