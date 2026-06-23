import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cancelReservation, cancelReservationAttendees, getMyReservation, getMyReservations } from '../../lib/api/myReservations'

export function useMyReservations() {
  return useQuery({ queryKey: ['myReservations', 'list'], queryFn: getMyReservations })
}

export function useMyReservation(id: number | null) {
  return useQuery({
    queryKey: ['myReservations', 'detail', id],
    queryFn: () => getMyReservation(id as number),
    enabled: id !== null,
  })
}

export function useCancelReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myReservations'] })
    },
  })
}

export function useCancelReservationAttendees() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reservationId, attendeeIds }: { reservationId: number; attendeeIds: number[] }) =>
      cancelReservationAttendees(reservationId, attendeeIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myReservations'] })
    },
  })
}
