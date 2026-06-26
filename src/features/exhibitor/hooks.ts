import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createExhibitor,
  getExhibitors,
  issueExhibitorAccount,
  updateExhibitor,
  type ExhibitorInput,
} from '../../lib/api/exhibitors'

export function useExhibitors(exhibitionId?: number | null) {
  return useQuery({
    queryKey: ['exhibitors', 'list', exhibitionId ?? 'all'],
    queryFn: () => getExhibitors(exhibitionId ?? undefined),
  })
}

export function useCreateExhibitor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ exhibitionId, input }: { exhibitionId: number; input: ExhibitorInput }) => createExhibitor(exhibitionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitors'] })
    },
  })
}

export function useUpdateExhibitor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ExhibitorInput }) => updateExhibitor(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitors'] })
    },
  })
}

export function useIssueExhibitorAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => issueExhibitorAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitors'] })
    },
  })
}
