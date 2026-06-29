import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  generateSettlement,
  getSettlements,
  type GenerateSettlementInput,
  type GetSettlementsParams,
} from '../../lib/api/settlements'

export function useSettlements(params: GetSettlementsParams = {}) {
  return useQuery({
    queryKey: ['settlements', params.exhibitionId, params.status],
    queryFn: () => getSettlements(params),
  })
}

export function useGenerateSettlement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: GenerateSettlementInput) => generateSettlement(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
    },
  })
}
