import { useQuery } from '@tanstack/react-query'
import { getExhibitorPointStats } from '../../lib/api/exhibitorStats'
import type { ScannerScanPointType } from '../../lib/api/scanner'

export function useExhibitorPointStats(params: {
  scanPointType: ScannerScanPointType
  scanPointId: number
} | null) {
  return useQuery({
    queryKey: ['exhibitor', 'point-stats', params?.scanPointType, params?.scanPointId],
    queryFn: () => getExhibitorPointStats(params!),
    enabled: params !== null,
  })
}
