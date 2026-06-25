import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTimeSlot, deleteTimeSlot, getTimeSlots, updateTimeSlot, type TimeSlotInput } from '../../lib/api/timeSlots'

export function useTimeSlots(exhibitionId: number | null) {
  return useQuery({
    queryKey: ['timeSlots', exhibitionId],
    queryFn: () => getTimeSlots(exhibitionId as number),
    enabled: exhibitionId !== null,
  })
}

export function useCreateTimeSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ exhibitionId, input }: { exhibitionId: number; input: TimeSlotInput }) => createTimeSlot(exhibitionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeSlots'] })
    },
  })
}

export function useUpdateTimeSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: TimeSlotInput }) => updateTimeSlot(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeSlots'] })
    },
  })
}

export function useDeleteTimeSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteTimeSlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeSlots'] })
    },
  })
}
