import { useQuery } from '@tanstack/react-query'
import { getTicketTypes } from '../../lib/api/ticketTypes'

export function useTicketTypes(exhibitionId: number | null) {
  return useQuery({
    queryKey: ['ticketTypes', exhibitionId],
    queryFn: () => getTicketTypes(exhibitionId as number),
    enabled: exhibitionId !== null,
  })
}
