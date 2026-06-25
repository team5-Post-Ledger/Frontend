import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createNameTagBatch, getNameTagSummary, getNameTags } from '../../lib/api/nameTags'
import type { NameTagStatus } from '../../types'

export function useNameTagSummary(exhibitionId: number | null) {
  return useQuery({
    queryKey: ['nameTags', 'summary', exhibitionId],
    queryFn: () => getNameTagSummary(exhibitionId as number),
    enabled: exhibitionId !== null,
  })
}

export function useNameTags(exhibitionId: number | null, status?: NameTagStatus) {
  return useQuery({
    queryKey: ['nameTags', 'list', exhibitionId, status ?? 'ALL'],
    queryFn: () => getNameTags(exhibitionId as number, status),
    enabled: exhibitionId !== null,
  })
}

export function useCreateNameTagBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ exhibitionId, count }: { exhibitionId: number; count: number }) => createNameTagBatch(exhibitionId, count),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nameTags'] })
    },
  })
}
