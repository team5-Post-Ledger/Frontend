import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { StepperNav } from '../../../components/Stepper'
import { useExhibition } from '../../../features/exhibition/hooks'
import { formatSlotRange } from '../../../features/timeSlot/format'
import { useTicketTypes } from '../../../features/ticketType/hooks'
import { useTimeSlots } from '../../../features/timeSlot/hooks'
import { formatCurrency } from '../../../lib/format'
import { useReserveStore } from '../../../stores/reserveStore'

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function TermRow({
  checked,
  onToggle,
  label,
  required,
}: {
  checked: boolean
  onToggle: () => void
  label: string
  required?: boolean
}) {
  return (
    <button type="button" onClick={onToggle} className="flex items-center gap-3 text-left">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center border ${
          checked ? 'border-primary bg-primary text-white' : 'border-line bg-white text-transparent'
        }`}
      >
        <CheckIcon />
      </span>
      <span className="text-sm text-ink">
        {label} <span className={required ? 'text-muted' : 'text-muted/70'}>{required ? '(필수)' : '(선택)'}</span>
      </span>
    </button>
  )
}

export default function ReserveConfirmPage() {
  const navigate = useNavigate()

  const exhibitionId = useReserveStore((state) => state.exhibitionId)
  const timeSlotId = useReserveStore((state) => state.timeSlotId)
  const ticketTypeId = useReserveStore((state) => state.ticketTypeId)
  const groupSize = useReserveStore((state) => state.groupSize)
  const movementMode = useReserveStore((state) => state.movementMode)
  const attendees = useReserveStore((state) => state.attendees)

  const exhibition = useExhibition(exhibitionId)
  const ticketTypes = useTicketTypes(exhibitionId)
  const timeSlots = useTimeSlots(exhibitionId)

  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)

  useEffect(() => {
    if (!exhibitionId || !timeSlotId || !ticketTypeId) {
      navigate('/reserve', { replace: true })
    }
  }, [exhibitionId, timeSlotId, ticketTypeId, navigate])

  if (!exhibitionId || !timeSlotId || !ticketTypeId) {
    return null
  }

  const ticketType = ticketTypes.data?.find((ticket) => ticket.id === ticketTypeId)
  const timeSlot = timeSlots.data?.find((slot) => slot.id === timeSlotId)
  const representative = attendees.find((attendee) => attendee.isGroupLeader)
  const amount = (ticketType?.price ?? 0) * groupSize
  const isLoadingSummary = exhibition.isLoading || ticketTypes.isLoading || timeSlots.isLoading
  const canPay = agreeTerms && agreePrivacy

  function handlePrev() {
    navigate('/reserve/attendees')
  }

  function handlePay() {
    if (!canPay) return
    navigate('/pay')
  }

  return (
    <div className="flex flex-col gap-6">
      {isLoadingSummary ? (
        <p className="text-sm text-muted">불러오는 중...</p>
      ) : (
        <>
          <div className="border border-line bg-white">
            <div className="border-b border-line bg-surface px-4 py-3 text-sm font-bold text-ink">예약 요약</div>
            <dl className="flex flex-col">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <dt className="text-sm text-muted">박람회</dt>
                <dd className="text-sm font-semibold text-ink">{exhibition.data?.title ?? '-'}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <dt className="text-sm text-muted">티켓 타입</dt>
                <dd className="text-sm font-semibold text-ink">{ticketType?.name ?? '-'}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <dt className="text-sm text-muted">슬롯</dt>
                <dd className="text-sm font-semibold text-ink">
                  {timeSlot ? formatSlotRange(timeSlot.startAt, timeSlot.endAt) : '-'}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <dt className="text-sm text-muted">인원</dt>
                <dd className="text-sm font-semibold text-ink">{groupSize}명</dd>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <dt className="text-sm text-muted">이동 방식</dt>
                <dd className="text-sm font-semibold text-ink">
                  {movementMode === 'GROUP' ? `그룹 · 대표 ${representative?.name || '미지정'}` : '개인'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex items-center justify-between border border-primary p-4">
            <span className="text-sm font-bold text-ink">총 결제 금액</span>
            <span className="text-xl font-extrabold text-ink">{formatCurrency(amount)}</span>
          </div>

          <div className="flex flex-col gap-3">
            <TermRow checked={agreeTerms} onToggle={() => setAgreeTerms((prev) => !prev)} label="이용약관 및 환불 규정에 동의합니다" required />
            <TermRow checked={agreePrivacy} onToggle={() => setAgreePrivacy((prev) => !prev)} label="개인정보 수집·이용에 동의합니다" required />
            <TermRow checked={agreeMarketing} onToggle={() => setAgreeMarketing((prev) => !prev)} label="마케팅 정보 수신에 동의합니다" />
          </div>
        </>
      )}

      <StepperNav isLastStep onPrev={handlePrev} onNext={handlePay} isNextDisabled={!canPay || isLoadingSummary} nextLabel="결제하기" />
    </div>
  )
}
