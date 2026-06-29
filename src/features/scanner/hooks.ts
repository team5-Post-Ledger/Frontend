import { useMutation, useQuery } from '@tanstack/react-query'
import { getExhibitorContext, getScanPoints, submitScan } from '../../lib/api/scanner'

export function useScanPoints() {
  return useQuery({ queryKey: ['scanner', 'scan-points'], queryFn: getScanPoints })
}

export function useExhibitorContext() {
  return useQuery({ queryKey: ['scanner', 'exhibitor-context'], queryFn: getExhibitorContext })
}

export function useSubmitScan() {
  return useMutation({ mutationFn: submitScan })
}
