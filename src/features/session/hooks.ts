import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createSession, deleteSession, getSessions, updateSession, type SessionInput } from '../../lib/api/sessions'

export function useSessions(exhibitionId: number | null) {
  return useQuery({
    queryKey: ['sessions', exhibitionId],
    queryFn: () => getSessions(exhibitionId as number),
    enabled: exhibitionId !== null,
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ exhibitionId, input }: { exhibitionId: number; input: SessionInput }) => createSession(exhibitionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useUpdateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: SessionInput }) => updateSession(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
