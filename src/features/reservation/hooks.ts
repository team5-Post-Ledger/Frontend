import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  exportReservationAttendees,
  getReservationAttendeeExportRows,
  getReservationDetail,
  getReservations,
  payReservationOnsite,
  type ReservationAttendeeExportFilters,
} from '../../lib/api/reservations'

export function useReservations(exhibitionId?: number | null) {
  return useQuery({
    queryKey: ['reservations', 'list', exhibitionId ?? 'all'],
    queryFn: () => getReservations(exhibitionId ?? undefined),
  })
}

export function useReservationDetail(id: number | null, exhibitionId?: number | null) {
  return useQuery({
    queryKey: ['reservations', 'detail', id, exhibitionId ?? 'all'],
    queryFn: () => getReservationDetail(id as number, exhibitionId ?? undefined),
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
