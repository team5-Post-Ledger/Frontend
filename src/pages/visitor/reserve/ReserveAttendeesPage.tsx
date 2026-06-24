import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Field, fieldControlClass } from '../../../components/Field'
import { StepperNav } from '../../../components/Stepper'
import { useAuthStore } from '../../../stores/authStore'
import { useReserveStore, type ReserveAttendeeDraft } from '../../../stores/reserveStore'
import type { MovementMode } from '../../../types'

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

const MOVEMENT_MODE_COPY: Record<MovementMode, { label: string; body: string }> = {
  INDIVIDUAL: { label: '개인', body: '참석자 각자 개별로 이동·체크인합니다.' },
  GROUP: { label: '그룹', body: '대표 1명이 인솔하며 함께 이동·체크인합니다.' },
}

export default function ReserveAttendeesPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const exhibitionId = useReserveStore((state) => state.exhibitionId)
  const timeSlotId = useReserveStore((state) => state.timeSlotId)
  const ticketTypeId = useReserveStore((state) => state.ticketTypeId)
  const groupSize = useReserveStore((state) => state.groupSize)
  const movementMode = useReserveStore((state) => state.movementMode)
  const attendees = useReserveStore((state) => state.attendees)
  const selectIndividualMode = useReserveStore((state) => state.selectIndividualMode)
  const selectGroupMode = useReserveStore((state) => state.selectGroupMode)
  const setGroupSize = useReserveStore((state) => state.setGroupSize)
  const addAttendee = useReserveStore((state) => state.addAttendee)
  const removeAttendee = useReserveStore((state) => state.removeAttendee)
  const updateAttendee = useReserveStore((state) => state.updateAttendee)
  const setRepresentative = useReserveStore((state) => state.setRepresentative)

  useEffect(() => {
    if (!exhibitionId || !timeSlotId || !ticketTypeId) {
      navigate('/reserve', { replace: true })
    }
  }, [exhibitionId, timeSlotId, ticketTypeId, navigate])

  const isFirstAttendeeBlank = !attendees[0]?.name && !attendees[0]?.phone
  const hasAccountInfo = Boolean(user?.name) || Boolean(user?.phone)

  // 첫 렌더(마운트) 시점에 개인 모드인데 본인 정보가 아직 안 채워졌으면 채운다.
  // 탭 클릭 시에는 handleSelectMode가 이미 채우므로 여기서는 빈 상태일 때만 채워 중복 호출을 막는다.
  useEffect(() => {
    if (movementMode !== 'INDIVIDUAL') return
    if (!isFirstAttendeeBlank || !hasAccountInfo) return
    selectIndividualMode({ name: user?.name ?? '', phone: user?.phone ?? '', email: '', isGroupLeader: false })
  }, [movementMode, isFirstAttendeeBlank, hasAccountInfo, user, selectIndividualMode])

  const isNextDisabled = attendees.some((attendee) => !attendee.name.trim() || !attendee.phone.trim())

  // GROUP: 인원수(head_count)는 명단행 수보다 작을 수 없다. INDIVIDUAL: 최소 1명.
  const minGroupSize = movementMode === 'GROUP' ? Math.max(2, attendees.length) : 1
  // GROUP은 대표 1명만 필수이고 명단은 선택 — 인원수(head_count)를 넘지 않는 한도까지만 추가 가능.
  const canAddGroupAttendee = attendees.length < groupSize
  const canRemoveAttendee = (index: number) => attendees.length > 1 && !attendees[index]?.isGroupLeader

  function selfAttendee(isGroupLeader: boolean): ReserveAttendeeDraft {
    // 계정에 이름/전화가 없는 경우(토큰만 있는 경우) 빈 값으로 시작 — 직접 입력 가능
    return { name: user?.name ?? '', phone: user?.phone ?? '', email: '', isGroupLeader }
  }

  function handleSelectMode(mode: MovementMode) {
    if (mode === movementMode) return
    if (mode === 'INDIVIDUAL') {
      selectIndividualMode(selfAttendee(false))
    } else {
      selectGroupMode(selfAttendee(true))
    }
  }

  function handleNext() {
    if (isNextDisabled) return
    navigate('/reserve/confirm')
  }

  function handlePrev() {
    navigate('/reserve')
  }

  return (
    <div className="flex flex-col gap-7">
      <div>
        <div className="mb-3 text-sm font-bold text-ink">이동 방식</div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {(Object.keys(MOVEMENT_MODE_COPY) as MovementMode[]).map((mode) => {
            const isSelected = movementMode === mode
            return (
              <button
                key={mode}
                type="button"
                onClick={() => handleSelectMode(mode)}
                className={`flex flex-col gap-1.5 border p-4 text-left transition-colors ${
                  isSelected ? 'border-primary bg-surface' : 'border-line bg-white hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center border ${
                      isSelected ? 'border-primary bg-primary text-white' : 'border-line bg-white text-transparent'
                    }`}
                  >
                    <CheckIcon />
                  </span>
                  <span className="text-sm font-bold text-ink">{MOVEMENT_MODE_COPY[mode].label}</span>
                </div>
                <p className="text-xs leading-relaxed text-muted">{MOVEMENT_MODE_COPY[mode].body}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div className="mb-3 text-sm font-bold text-ink">인원수</div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setGroupSize(groupSize - 1)}
            disabled={groupSize <= minGroupSize}
            className="flex h-11 w-11 items-center justify-center border border-line text-lg font-bold text-ink transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
          <span className="min-w-[40px] text-center text-xl font-extrabold text-ink">{groupSize}</span>
          <button
            type="button"
            onClick={() => setGroupSize(groupSize + 1)}
            className="flex h-11 w-11 items-center justify-center border border-line text-lg font-bold text-ink transition-colors hover:border-primary"
          >
            +
          </button>
          <span className="text-sm text-muted">명</span>
        </div>
        {movementMode === 'GROUP' && (
          <p className="mt-2 text-xs leading-relaxed text-muted">
            대표 QR 1개로 인원수 전체가 함께 입장합니다. 명단은 아는 참석자만 선택적으로 추가하세요.
          </p>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-ink">참석자 명단</span>
          {movementMode === 'GROUP' && (
            <span className="text-xs text-muted">
              {attendees.length} / {groupSize}명 등록
            </span>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {attendees.map((attendee, index) => (
            <div key={index} className="border border-line bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold text-muted">참석자 {index + 1}</span>
                <div className="flex items-center gap-2">
                  {movementMode === 'GROUP' && (
                    <button
                      type="button"
                      onClick={() => setRepresentative(index)}
                      className={`px-2.5 py-1 text-[11px] font-bold transition-colors ${
                        attendee.isGroupLeader ? 'bg-ink text-white' : 'border border-line text-muted hover:text-ink'
                      }`}
                    >
                      {attendee.isGroupLeader ? '대표' : '대표로 지정'}
                    </button>
                  )}
                  {canRemoveAttendee(index) && (
                    <button
                      type="button"
                      onClick={() => removeAttendee(index)}
                      className="px-2.5 py-1 text-[11px] font-bold text-muted transition-colors hover:text-danger"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Field label="이름" id={`attendee-${index}-name`} required>
                  <input
                    id={`attendee-${index}-name`}
                    value={attendee.name}
                    onChange={(event) => updateAttendee(index, { name: event.target.value })}
                    placeholder="이름 입력"
                    className={fieldControlClass}
                  />
                </Field>
                <Field label="전화번호" id={`attendee-${index}-phone`} required>
                  <input
                    id={`attendee-${index}-phone`}
                    value={attendee.phone}
                    onChange={(event) => updateAttendee(index, { phone: event.target.value })}
                    placeholder="010-0000-0000"
                    className={fieldControlClass}
                  />
                </Field>
                <Field label="이메일" id={`attendee-${index}-email`} hint="선택 항목입니다.">
                  <input
                    id={`attendee-${index}-email`}
                    type="email"
                    value={attendee.email}
                    onChange={(event) => updateAttendee(index, { email: event.target.value })}
                    placeholder="name@email.com"
                    className={fieldControlClass}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>

        {movementMode === 'GROUP' && (
          <button
            type="button"
            onClick={() => addAttendee()}
            disabled={!canAddGroupAttendee}
            title={canAddGroupAttendee ? undefined : '인원수를 먼저 늘려주세요'}
            className="mt-3 flex h-11 w-full items-center justify-center border border-dashed border-line text-sm font-bold text-muted transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            + 동행자 정보 추가 (선택)
          </button>
        )}
      </div>

      <StepperNav onPrev={handlePrev} onNext={handleNext} isNextDisabled={isNextDisabled} nextLabel="다음" />
    </div>
  )
}
