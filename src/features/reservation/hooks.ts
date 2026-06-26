import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  exportReservationAttendees,
  getReservationAttendeeExportRows,
  getReservationDetail,
  getReservations,
  type ReservationAttendeeExportFilters,
  type ReservationListItem,
} from '../../lib/api/reservations'
import { recordReservationOnsitePayment } from '../../lib/api/payments'

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
    mutationFn: (reservation: ReservationListItem) => recordReservationOnsitePayment(reservation),
    onSuccess: (updated) => {
      queryClient.setQueriesData<ReservationListItem[]>({ queryKey: ['reservations', 'list'] }, (old) =>
        old ? old.map((item) => (item.id === updated.id ? updated : item)) : old,
      )
      queryClient.setQueriesData<ReservationListItem | null>({ queryKey: ['reservations', 'detail', updated.id] }, () => updated)
    },
  })
}

export function useReservationAttendeeExportPreview(exhibitionId: number | null, filters: ReservationAttendeeExportFilters) {
  return useQuery({
    queryKey: ['reservations', 'export-preview', exhibitionId, filters],
    queryFn: () => getReservationAttendeeExportRows(exhibitionId as number, filters),
    enabled: exhibitionId !== null,
  })
}

export function useExportReservationAttendees() {
  return useMutation({
    mutationFn: ({ exhibitionId, filters }: { exhibitionId: number; filters: ReservationAttendeeExportFilters }) =>
      exportReservationAttendees(exhibitionId, filters),
  })
}
