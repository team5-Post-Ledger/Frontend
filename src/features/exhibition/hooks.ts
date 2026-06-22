import { useQuery } from '@tanstack/react-query'
import { getExhibition } from '../../lib/api/exhibitions'

const CURRENT_EXHIBITION_ID = 1

export function useCurrentExhibition() {
  return useQuery({
    queryKey: ['exhibition', 'current', CURRENT_EXHIBITION_ID],
    queryFn: () => getExhibition(CURRENT_EXHIBITION_ID),
  })
}
