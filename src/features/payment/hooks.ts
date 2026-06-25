import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitPayment } from '../../lib/api/payments'

export function useSubmitPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: submitPayment,
    onSuccess: (result) => {
      if (!result.success) return
      queryClient.invalidateQueries({ queryKey: ['myReservations'] })
    },
  })
}
