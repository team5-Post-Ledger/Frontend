import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Field, fieldControlClass } from '../../../components/Field'
import { QueryState } from '../../../components/QueryState'
import { StepperNav } from '../../../components/Stepper'
import { useRecommendedExhibitions } from '../../../features/exhibition/hooks'
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

export default function ReserveSelectPage() {
  const navigate = useNavigate()
  const exhibitions = useRecommendedExhibitions()

  const exhibitionId = useReserveStore((state) => state.exhibitionId)
  const timeSlotId = useReserveStore((state) => state.timeSlotId)
  const ticketTypeId = useReserveStore((state) => state.ticketTypeId)
  const setSelection = useReserveStore((state) => state.setSelection)

  useEffect(() => {
    if (exhibitionId === null && exhibitions.data && exhibitions.data.length > 0) {
      setSelection({ exhibitionId: exhibitions.data[0].id, timeSlotId: null, ticketTypeId: null })
    }
  }, [exhibitionId, exhibitions.data, setSelection])

  const timeSlots = useTimeSlots(exhibitionId)
  const ticketTypes = useTicketTypes(exhibitionId)

  const isNextDisabled = !exhibitionId || !timeSlotId || !ticketTypeId

  function handleNext() {
    if (isNextDisabled) return
    navigate('/reserve/attendees')
  }

  return (
    <div className="flex flex-col gap-7">
      <Field label="박람회" id="reserve-exhibition" hint="예약할 박람회를 선택하세요.">
        <QueryState
          isLoading={exhibitions.isLoading}
          isError={exhibitions.isError}
          isEmpty={exhibitions.data?.length === 0}
          emptyMessage="예약 가능한 박람회가 없습니다."
          height={48}
        >
          <select
            id="reserve-exhibition"
            value={exhibitionId ?? ''}
            onChange={(event) => setSelection({ exhibitionId: Number(event.target.value), timeSlotId: null, ticketTypeId: null })}
            className={fieldControlClass}
          >
            {exhibitions.data?.map((exhibition) => (
              <option key={exhibition.id} value={exhibition.id}>
                {exhibition.title}
              </option>
            ))}
          </select>
        </QueryState>
      </Field>

      <div>
        <div className="mb-3 text-sm font-bold text-ink">티켓 타입</div>
        <QueryState
          isLoading={ticketTypes.isLoading}
          isError={ticketTypes.isError}
          isEmpty={ticketTypes.data?.length === 0}
          emptyMessage="선택한 박람회에 등록된 티켓이 없습니다."
          height={120}
        >
          <div className="flex flex-col gap-2.5">
            {ticketTypes.data?.map((ticket) => {
              const isSelected = ticketTypeId === ticket.id
              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelection({ ticketTypeId: ticket.id })}
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
                  <span className="flex-1 text-sm font-bold text-ink">{ticket.name}</span>
                  <span className="text-sm font-bold text-ink">{ticket.price === 0 ? '무료' : formatCurrency(ticket.price)}</span>
                </button>
              )
            })}
          </div>
        </QueryState>
      </div>

      <div>
        <div className="mb-3 text-sm font-bold text-ink">예약 슬롯 (시간대)</div>
        <QueryState
          isLoading={timeSlots.isLoading}
          isError={timeSlots.isError}
          isEmpty={timeSlots.data?.length === 0}
          emptyMessage="선택한 박람회에 등록된 시간대가 없습니다."
          height={120}
        >
          <div className="flex flex-col gap-2.5">
            {timeSlots.data?.map((slot) => {
              const remaining = slot.capacity - slot.reservedCount
              const isClosed = remaining <= 0
              const isSelected = timeSlotId === slot.id
              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={isClosed}
                  onClick={() => setSelection({ timeSlotId: slot.id })}
                  className={`flex items-center justify-between gap-3 border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected ? 'border-primary bg-surface' : 'border-line bg-white hover:border-primary/50'
                  }`}
                >
                  <span className="text-sm font-bold text-ink">{formatSlotRange(slot.startAt, slot.endAt)}</span>
                  <span className="text-xs font-bold text-muted">{isClosed ? '마감' : `잔여 ${remaining}석`}</span>
                </button>
              )
            })}
          </div>
        </QueryState>
      </div>

      <StepperNav isFirstStep onNext={handleNext} isNextDisabled={isNextDisabled} nextLabel="다음" />
    </div>
  )
}
