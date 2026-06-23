import { useMutation } from '@tanstack/react-query'
import { submitPayment } from '../../lib/api/payments'

export function useSubmitPayment() {
  return useMutation({ mutationFn: submitPayment })
}
