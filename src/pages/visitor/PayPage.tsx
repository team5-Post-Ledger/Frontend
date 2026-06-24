import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useSubmitPayment } from '../../features/payment/hooks'
import { useExhibition } from '../../features/exhibition/hooks'
import { useTicketTypes } from '../../features/ticketType/hooks'
import type { PaymentSubmissionResult } from '../../lib/api/payments'
import { formatCurrency } from '../../lib/format'
import { useReserveStore } from '../../stores/reserveStore'

type PaymentMethod = 'card' | 'transfer' | 'easy'

const PAYMENT_METHODS: Array<{ id: PaymentMethod; label: string }> = [
  { id: 'card', label: '신용·체크카드' },
  { id: 'transfer', label: '계좌이체' },
  { id: 'easy', label: '간편결제' },
]

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

export default function PayPage() {
  const navigate = useNavigate()

  const exhibitionId = useReserveStore((state) => state.exhibitionId)
  const timeSlotId = useReserveStore((state) => state.timeSlotId)
  const ticketTypeId = useReserveStore((state) => state.ticketTypeId)
  const movementMode = useReserveStore((state) => state.movementMode)
  const groupSize = useReserveStore((state) => state.groupSize)
  const attendees = useReserveStore((state) => state.attendees)
  const resetReserveDraft = useReserveStore((state) => state.reset)

  const exhibition = useExhibition(exhibitionId)
  const ticketTypes = useTicketTypes(exhibitionId)

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [result, setResult] = useState<PaymentSubmissionResult | null>(null)
  const submitPaymentMutation = useSubmitPayment()

  const isPaymentComplete = result?.success === true
  const isMissingReserveDraft = !exhibitionId || !timeSlotId || !ticketTypeId

  useEffect(() => {
      if (!isPaymentComplete && isMissingReserveDraft) {
          navigate('/reserve', { replace: true })
      }
  }, [isPaymentComplete, isMissingReserveDraft, navigate])

  if (!isPaymentComplete && isMissingReserveDraft) {
      return null
  }

  const ticketType = ticketTypes.data?.find((ticket) => ticket.id === ticketTypeId)
  const amount = (ticketType?.price ?? 0) * groupSize

  function handlePay() {
    submitPaymentMutation.mutate(
      {
        exhibitionId: exhibitionId!,
        timeSlotId: timeSlotId!,
        ticketTypeId: ticketTypeId!,
        movementMode,
        groupSize,
        attendees: attendees.map((attendee) => ({
          name: attendee.name,
          phone: attendee.phone,
          email: attendee.email || undefined,
          isGroupLeader: attendee.isGroupLeader,
        })),
        amount,
      },
      { onSuccess: setResult },
    )
  }

  function handleDone(path: string) {
    resetReserveDraft()
    navigate(path)
  }

  if (result?.success) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-16 text-center lg:py-20">
        <span className="flex h-16 w-16 items-center justify-center border-2 border-success text-success">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>

        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">예약이 완료되었습니다</h1>
          <p className="mt-2 text-sm text-muted">{exhibition.data?.title ?? '박람회'} 예약 결제가 정상적으로 처리되었습니다.</p>
        </div>

        <div className="w-full border border-line bg-white p-5 text-left">
          <dl className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-muted">예약번호</dt>
              <dd className="font-mono text-sm font-bold text-ink">{result.reservationCode}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-muted">결제 금액</dt>
              <dd className="text-sm font-bold text-ink">{formatCurrency(result.amount ?? amount)}</dd>
            </div>
          </dl>
        </div>

        <div className="w-full border border-line bg-surface p-4 text-left text-sm leading-relaxed text-muted">
          참석자별 모바일 티켓 QR은 <span className="font-semibold text-ink">내 티켓</span>에서 확인할 수 있습니다. 입장 시 QR을 제시해주세요.
        </div>

        <div className="flex w-full flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => handleDone('/my/reservations')}
            className="flex h-12 flex-1 items-center justify-center bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-hover"
          >
              내 예약 확인하기
          </button>
          <button
            type="button"
            onClick={() => handleDone('/')}
            className="flex h-12 flex-1 items-center justify-center border border-line text-sm font-bold text-ink transition-colors hover:border-primary"
          >
            홈으로
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 lg:py-10">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">결제하기</h1>
        <p className="mt-1 text-sm text-muted">결제 수단을 선택하고 결제를 진행하세요.</p>
      </div>

      {result && !result.success && (
        <div className="border border-danger bg-danger/5 p-4 text-sm text-danger">
          {result.failureReason ?? '결제에 실패했습니다. 다시 시도해주세요.'}
        </div>
      )}

      <div>
        <div className="mb-3 text-sm font-bold text-ink">결제 수단</div>
        <div className="flex flex-col gap-2.5">
          {PAYMENT_METHODS.map((method) => {
            const isSelected = paymentMethod === method.id
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id)}
                className={`flex items-center gap-3 border p-4 text-left transition-colors ${
                  isSelected ? 'border-primary bg-surface' : 'border-line bg-white hover:border-primary/50'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center border ${
                    isSelected ? 'border-primary bg-primary text-white' : 'border-line bg-white text-transparent'
                  }`}
                >
                  <CheckIcon />
                </span>
                <span className="text-sm font-bold text-ink">{method.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border border-primary p-4">
        <span className="text-sm font-bold text-ink">결제 금액</span>
        <span className="text-xl font-extrabold text-ink">{formatCurrency(amount)}</span>
      </div>

      <button
        type="button"
        onClick={handlePay}
        disabled={submitPaymentMutation.isPending}
        className="flex h-12 items-center justify-center gap-2 bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-default disabled:bg-muted"
      >
        {submitPaymentMutation.isPending && (
          <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />
        )}
        {submitPaymentMutation.isPending ? '결제 처리 중...' : '결제하기'}
      </button>
    </div>
  )
}
