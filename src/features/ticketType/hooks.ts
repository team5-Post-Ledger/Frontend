import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTicketType,
  deleteTicketType,
  getTicketTypes,
  updateTicketType,
  type TicketTypeInput,
} from '../../lib/api/ticketTypes'

export function useTicketTypes(exhibitionId: number | null) {
  return useQuery({
    queryKey: ['ticketTypes', exhibitionId],
    queryFn: () => getTicketTypes(exhibitionId as number),
    enabled: exhibitionId !== null,
  })
}

export function useCreateTicketType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ exhibitionId, input }: { exhibitionId: number; input: TicketTypeInput }) => createTicketType(exhibitionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketTypes'] })
    },
  })
}

export function useUpdateTicketType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: TicketTypeInput }) => updateTicketType(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketTypes'] })
    },
  })
}

export function useDeleteTicketType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteTicketType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketTypes'] })
    },
  })
}
