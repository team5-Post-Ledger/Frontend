import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bindNameTag,
  createWalkInReservation,
  getCheckinLogs,
  getRecentCheckins,
  getReservationCheckinStatus,
  recordOnsitePayment,
  searchAttendees,
  verifyTicketQr,
  type AttendeeSearchQuery,
  type BindNameTagOptions,
  type WalkInInput,
} from '../../lib/api/checkin'

export function useRecentCheckins(exhibitionId?: number | null) {
  return useQuery({
    queryKey: ['checkin', 'recent', exhibitionId ?? 'all'],
    queryFn: () => getRecentCheckins(exhibitionId ?? undefined),
  })
}

export function useCheckinLogs(limit?: number, exhibitionId?: number | null) {
  return useQuery({
    queryKey: ['checkin', 'logs', limit ?? 10, exhibitionId ?? 'all'],
    queryFn: () => getCheckinLogs(limit, exhibitionId ?? undefined),
  })
}

export function useVerifyTicketQr(exhibitionId?: number | null) {
  return useMutation({ mutationFn: (token: string) => verifyTicketQr(token, exhibitionId ?? undefined) })
}

export function useSearchAttendees(exhibitionId?: number | null) {
  return useMutation({ mutationFn: (query: AttendeeSearchQuery) => searchAttendees(query, exhibitionId ?? undefined) })
}

export function useBindNameTag(exhibitionId?: number | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      attendeeId,
      nameTagToken,
      options,
    }: {
      attendeeId: number
      nameTagToken: string
      options?: BindNameTagOptions
    }) => bindNameTag(attendeeId, nameTagToken, { ...options, exhibitionId: exhibitionId ?? undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin'] })
      queryClient.invalidateQueries({ queryKey: ['nameTags'] })
    },
  })
}

export function useCreateWalkInReservation() {
  return useMutation({
    mutationFn: ({ exhibitionId, input }: { exhibitionId: number; input: WalkInInput }) => createWalkInReservation(exhibitionId, input),
  })
}

export function useRecordOnsitePayment() {
  return useMutation({
    mutationFn: ({ reservationId, amount }: { reservationId: number; amount: number }) => recordOnsitePayment(reservationId, amount),
  })
}

export function useReservationCheckinStatus(reservationId: number | null) {
  return useQuery({
    queryKey: ['checkin', 'status', reservationId],
    queryFn: () => getReservationCheckinStatus(reservationId as number),
    enabled: reservationId !== null,
  })
}
