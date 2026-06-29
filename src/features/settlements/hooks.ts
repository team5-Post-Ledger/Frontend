import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  confirmSettlement,
  exportSettlement,
  generateSettlement,
  getSettlement,
  getSettlements,
  payoutSettlement,
  type GenerateSettlementInput,
  type GetSettlementsParams,
} from '../../lib/api/settlements'

export function useSettlements(params: GetSettlementsParams = {}) {
  return useQuery({
    queryKey: ['settlements', params.exhibitionId, params.status],
    queryFn: () => getSettlements(params),
  })
}

export function useSettlement(id: number) {
  return useQuery({
    queryKey: ['settlement', id],
    queryFn: () => getSettlement(id),
    enabled: !isNaN(id),
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

export function useConfirmSettlement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => confirmSettlement(id),
    onSuccess: (data) => {
      queryClient.setQueryData(['settlement', data.id], data)
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
    },
  })
}

export function usePayoutSettlement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => payoutSettlement(id),
    onSuccess: (data) => {
      queryClient.setQueryData(['settlement', data.id], data)
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
    },
  })
}

export function useExportSettlement() {
  return useMutation({
    mutationFn: ({ id, format }: { id: number; format: 'xlsx' | 'pdf' }) =>
      exportSettlement(id, format),
  })
}
