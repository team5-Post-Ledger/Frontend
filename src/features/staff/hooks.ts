import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assignStaff, getStaffAssignments, unassignStaff, type StaffAssignInput } from '../../lib/api/staff'

export function useStaffAssignments(exhibitionId: number | null) {
  return useQuery({
    queryKey: ['staff', 'assignments', exhibitionId],
    queryFn: () => getStaffAssignments(exhibitionId as number),
    enabled: exhibitionId !== null,
  })
}

export function useAssignStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ exhibitionId, input }: { exhibitionId: number; input: StaffAssignInput }) => assignStaff(exhibitionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}

export function useUnassignStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ exhibitionId, assignmentId }: { exhibitionId: number; assignmentId: number }) => unassignStaff(exhibitionId, assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}
