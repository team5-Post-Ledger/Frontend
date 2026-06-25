import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bindNameTag,
  createWalkInReservation,
  getCheckinLogs,
  getRecentCheckins,
  recordOnsitePayment,
  searchAttendees,
  verifyTicketQr,
  type AttendeeSearchQuery,
  type BindNameTagOptions,
  type WalkInInput,
} from '../../lib/api/checkin'

export function useRecentCheckins() {
  return useQuery({
    queryKey: ['checkin', 'recent'],
    queryFn: getRecentCheckins,
  })
}

export function useCheckinLogs(limit?: number) {
  return useQuery({
    queryKey: ['checkin', 'logs', limit ?? 10],
    queryFn: () => getCheckinLogs(limit),
  })
}

export function useVerifyTicketQr() {
  return useMutation({ mutationFn: (token: string) => verifyTicketQr(token) })
}

export function useSearchAttendees() {
  return useMutation({ mutationFn: (query: AttendeeSearchQuery) => searchAttendees(query) })
}

export function useBindNameTag() {
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
    }) => bindNameTag(attendeeId, nameTagToken, options),
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
  return useMutation({ mutationFn: (amount: number) => recordOnsitePayment(amount) })
}
