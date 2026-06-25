import { useMutation } from '@tanstack/react-query'
import { askAssistant } from '../../lib/api/assistant'

export function useAskAssistant() {
  return useMutation({ mutationFn: askAssistant })
}
