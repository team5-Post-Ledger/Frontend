import { useMutation } from '@tanstack/react-query'
import { askAssistant, getMockRouteSuggestion } from '../../lib/api/assistant'

export function useAskAssistant() {
  return useMutation({ mutationFn: askAssistant })
}

export function useMockRouteSuggestion() {
  return useMutation({
    mutationFn: ({ exhibitionId, mustVisitBoothIds }: { exhibitionId: number; mustVisitBoothIds: number[] }) =>
      getMockRouteSuggestion(exhibitionId, mustVisitBoothIds),
  })
}
