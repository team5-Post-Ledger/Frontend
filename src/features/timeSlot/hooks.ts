import { useQuery } from '@tanstack/react-query'
import { getTimeSlots } from '../../lib/api/timeSlots'

export function useTimeSlots(exhibitionId: number | null) {
  return useQuery({
    queryKey: ['timeSlots', exhibitionId],
    queryFn: () => getTimeSlots(exhibitionId as number),
    enabled: exhibitionId !== null,
  })
}
