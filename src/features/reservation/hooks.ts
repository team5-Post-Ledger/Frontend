import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  exportReservationAttendees,
  getReservationAttendeeExportRows,
  getReservationDetail,
  getReservations,
  payReservationOnsite,
  type ReservationAttendeeExportFilters,
} from '../../lib/api/reservations'

export function useReservations() {
  return useQuery({
    queryKey: ['reservations', 'list'],
    queryFn: getReservations,
  })
}

export function useReservationDetail(id: number | null) {
  return useQuery({
    queryKey: ['reservations', 'detail', id],
    queryFn: () => getReservationDetail(id as number),
    enabled: id !== null,
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

export function useReservationAttendeeExportPreview(filters: ReservationAttendeeExportFilters) {
  return useQuery({
    queryKey: ['reservations', 'export-preview', filters],
    queryFn: () => getReservationAttendeeExportRows(filters),
  })
}

export function useExportReservationAttendees() {
  return useMutation({
    mutationFn: ({ exhibitionId, filters }: { exhibitionId: number; filters: ReservationAttendeeExportFilters }) =>
      exportReservationAttendees(exhibitionId, filters),
  })
}
