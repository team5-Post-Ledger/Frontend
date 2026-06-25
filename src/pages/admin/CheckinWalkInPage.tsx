import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Field, fieldControlClass } from '../../components/Field'
import { QRScanner } from '../../components/QRScanner'
import { QueryState } from '../../components/QueryState'
import { Stepper, type StepperStep } from '../../components/Stepper'
import { useCurrentExhibition } from '../../features/exhibition/hooks'
import { useBindNameTag, useCreateWalkInReservation, useRecordOnsitePayment } from '../../features/checkin/hooks'
import { useTicketTypes } from '../../features/ticketType/hooks'
import type { WalkInResult } from '../../lib/api/checkin'
import { formatCurrency, formatDateTime } from '../../lib/format'
import type { CheckinMethod, MovementMode } from '../../types'

const STEPS: StepperStep[] = [
  { key: 'info', label: '방문자 정보' },
  { key: 'payment', label: '현장 결제' },
  { key: 'nametag', label: '네임태그 바인딩' },
]

interface WalkInFormState {
  name: string
  phone: string
  groupSize: string
  movementMode: MovementMode
  ticketTypeId: number | null
}

type WalkInFormErrors = Partial<Record<'name' | 'phone' | 'groupSize' | 'ticketTypeId', string>>

interface BindOutcome {
  checkinMethod: CheckinMethod
  gateEntryRecorded: boolean
}

export default function CheckinWalkInPage() {
  const exhibition = useCurrentExhibition()
  const exhibitionId = exhibition.data?.id ?? null
  const ticketTypes = useTicketTypes(exhibitionId)

  const [phase, setPhase] = useState<'info' | 'payment' | 'nametag'>('info')
  const [form, setForm] = useState<WalkInFormState>({ name: '', phone: '', groupSize: '1', movementMode: 'INDIVIDUAL', ticketTypeId: null })
  const [errors, setErrors] = useState<WalkInFormErrors>({})

  const [walkInResult, setWalkInResult] = useState<WalkInResult | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null)
  const [paidAt, setPaidAt] = useState<string | null>(null)

  const [tagDraft, setTagDraft] = useState('')
  const [tagError, setTagError] = useState<string | null>(null)
  const [bindOutcome, setBindOutcome] = useState<BindOutcome | null>(null)

  const createWalkIn = useCreateWalkInReservation()
  const recordPayment = useRecordOnsitePayment()
  const bindNameTag = useBindNameTag()

  const selectedTicketType = useMemo(
    () => ticketTypes.data?.find((ticket) => ticket.id === form.ticketTypeId) ?? null,
    [ticketTypes.data, form.ticketTypeId],
  )
  const groupSizeNumber = Number(form.groupSize)
  const previewAmount = selectedTicketType && Number.isInteger(groupSizeNumber) && groupSizeNumber > 0 ? selectedTicketType.price * groupSizeNumber : 0

  function handleInfoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (exhibitionId === null) return

    const nextErrors: WalkInFormErrors = {}
    if (!form.name.trim()) nextErrors.name = '이름을 입력해주세요.'
    if (!form.phone.trim()) nextErrors.phone = '전화번호를 입력해주세요.'
    if (form.groupSize.trim() === '' || Number.isNaN(groupSizeNumber) || groupSizeNumber < 1) {
      nextErrors.groupSize = '1 이상의 숫자를 입력해주세요.'
    }
    if (form.ticketTypeId === null) nextErrors.ticketTypeId = '티켓 타입을 선택해주세요.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    createWalkIn.mutate(
      {
        exhibitionId,
        input: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          groupSize: groupSizeNumber,
          movementMode: form.movementMode,
          ticketTypeId: form.ticketTypeId as number,
        },
      },
      {
        onSuccess: (result) => {
          setWalkInResult(result)
          setPaymentAmount(previewAmount)
          setPhase('payment')
        },
      },
    )
  }

  function handleConfirmPayment() {
    if (paymentAmount === null || recordPayment.isPending) return
    recordPayment.mutate(paymentAmount, {
      onSuccess: (result) => {
        setPaidAt(result.paidAt)
        setPhase('nametag')
      },
    })
  }

  function handleTagScan(rawToken: string) {
    const token = rawToken.trim()
    if (!walkInResult || !token || bindNameTag.isPending) return

    setTagError(null)
    bindNameTag.mutate(
      {
        attendeeId: walkInResult.primaryAttendeeId,
        nameTagToken: token,
        options: { checkinMethod: 'WALK_IN' },
      },
      {
        onSuccess: (result) => {
          if (!result.ok) {
            setTagError(result.message)
            return
          }
          setBindOutcome({ checkinMethod: result.checkinMethod, gateEntryRecorded: result.gateEntryRecorded })
          setTagDraft('')
        },
        onError: () => setTagError('처리 중 오류가 발생했습니다. 다시 시도해주세요.'),
      },
    )
  }

  function handleRegisterNext() {
    setPhase('info')
    setForm({ name: '', phone: '', groupSize: '1', movementMode: 'INDIVIDUAL', ticketTypeId: null })
    setErrors({})
    setWalkInResult(null)
    setPaymentAmount(null)
    setPaidAt(null)
    setTagDraft('')
    setTagError(null)
    setBindOutcome(null)
  }

  if (exhibition.isError) {
    return <p className="text-sm text-danger">행사 정보를 불러오지 못했습니다.</p>
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">워크인 등록</h1>
        <p className="mt-1 text-sm text-muted">예약 없이 현장에 온 방문자를 등록하고, 결제·네임태그 바인딩까지 한 번에 처리합니다.</p>
      </div>

      <div className="border border-line bg-white p-5">
        <Stepper steps={STEPS} currentStep={phase === 'info' ? 0 : phase === 'payment' ? 1 : 2} />
      </div>

      {phase === 'info' && (
        <form onSubmit={handleInfoSubmit} className="border border-line bg-white p-5">
          <div className="mb-4">
            <div className="text-sm font-bold text-ink">① 방문자 정보 입력</div>
            <p className="mt-1 text-xs text-muted">예약 없이 현장 등록하는 방문자입니다. reservation_source=ONSITE_MANUAL로 생성됩니다.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="이름" id="walkin-name" required error={errors.name}>
              <input
                id="walkin-name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="예: 김방문"
                className={fieldControlClass}
              />
            </Field>
            <Field label="전화번호" id="walkin-phone" required error={errors.phone}>
              <input
                id="walkin-phone"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="예: 010-1234-5678"
                className={fieldControlClass}
              />
            </Field>
          </div>

          <div className="mt-4">
            <div className="mb-2.5 text-sm font-semibold text-muted">이동 방식</div>
            <div className="flex gap-1.5">
              {(['INDIVIDUAL', 'GROUP'] as MovementMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, movementMode: mode }))}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                    form.movementMode === mode ? 'bg-ink text-white' : 'border border-line text-muted hover:text-ink'
                  }`}
                >
                  {mode === 'INDIVIDUAL' ? '개인(INDIVIDUAL)' : '그룹(GROUP)'}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {form.movementMode === 'GROUP'
                ? '그룹은 대표 1명만 참석자로 등록되며, 인원수는 입장 시 head_count로 기록됩니다.'
                : '개인은 인원수만큼 참석자가 각각 등록됩니다(등록자 외 동행은 이름이 자동 부여됩니다).'}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="인원수" id="walkin-group-size" required error={errors.groupSize}>
              <input
                id="walkin-group-size"
                inputMode="numeric"
                value={form.groupSize}
                onChange={(event) => setForm((prev) => ({ ...prev, groupSize: event.target.value }))}
                className={fieldControlClass}
              />
            </Field>
            <Field label="티켓 타입" id="walkin-ticket-type" required error={errors.ticketTypeId}>
              <QueryState isLoading={ticketTypes.isLoading} isError={ticketTypes.isError} height={44}>
                <select
                  id="walkin-ticket-type"
                  value={form.ticketTypeId ?? ''}
                  onChange={(event) => setForm((prev) => ({ ...prev, ticketTypeId: event.target.value ? Number(event.target.value) : null }))}
                  className={fieldControlClass}
                >
                  <option value="">선택해주세요</option>
                  {ticketTypes.data?.map((ticket) => (
                    <option key={ticket.id} value={ticket.id}>
                      {ticket.name} · {ticket.price === 0 ? '무료' : formatCurrency(ticket.price)}
                    </option>
                  ))}
                </select>
              </QueryState>
            </Field>
          </div>

          {selectedTicketType && (
            <p className="mt-3 text-xs text-muted">
              예상 결제 금액: <b className="text-ink">{formatCurrency(previewAmount)}</b> ({form.groupSize}명 × {formatCurrency(selectedTicketType.price)})
            </p>
          )}

          <button
            type="submit"
            disabled={createWalkIn.isPending || exhibitionId === null}
            className="mt-5 flex h-11 items-center justify-center gap-2 bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-default disabled:bg-muted"
          >
            {createWalkIn.isPending && <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />}
            등록하고 결제로 이동
          </button>
        </form>
      )}

      {phase === 'payment' && walkInResult && paymentAmount !== null && (
        <div className="border border-line bg-white p-5">
          <div className="mb-4">
            <div className="text-sm font-bold text-ink">② 현장 결제</div>
            <p className="mt-1 text-xs text-muted">현장에서 결제를 확인한 뒤 결제 완료를 눌러주세요. pg_provider=ONSITE로 기록됩니다.</p>
          </div>

          <div className="border border-line bg-surface p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">등록 참석자</span>
              <span className="font-semibold text-ink">{walkInResult.attendees.map((attendee) => attendee.name).join(', ')}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted">결제 금액</span>
              <span className="text-lg font-extrabold text-ink">{formatCurrency(paymentAmount)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={recordPayment.isPending}
            className="mt-4 flex h-11 items-center justify-center gap-2 bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-default disabled:bg-muted"
          >
            {recordPayment.isPending && <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />}
            결제 완료
          </button>
        </div>
      )}

      {phase === 'nametag' && walkInResult && (
        <div className="flex flex-col gap-4">
          <div className="border border-line bg-white p-5">
            <div className="text-base font-bold text-ink">{walkInResult.attendees[0].name}</div>
            {paidAt && <div className="mt-1 text-xs text-muted">현장 결제 완료 · {formatDateTime(paidAt)}</div>}

            {form.movementMode === 'GROUP' && (
              <p className="mt-3 border border-line bg-surface p-3 text-xs leading-relaxed text-muted">
                그룹 예약입니다. 대표 1명만 네임태그를 바인딩하며, 입장 시 head_count {form.groupSize}명으로 기록됩니다.
              </p>
            )}
            {form.movementMode === 'INDIVIDUAL' && walkInResult.attendees.length > 1 && (
              <p className="mt-3 border border-line bg-surface p-3 text-xs leading-relaxed text-muted">
                등록자 본인만 이 화면에서 바인딩합니다. 나머지 동행 {walkInResult.attendees.length - 1}명은 수기 체크인(이름/전화
                조회)에서 개별적으로 네임태그를 바인딩해주세요.
              </p>
            )}
          </div>

          {!bindOutcome ? (
            <div className="border border-line bg-white p-5">
              <div className="mb-4">
                <div className="text-sm font-bold text-ink">③ 네임태그 QR 스캔</div>
                <p className="mt-1 text-xs text-muted">AVAILABLE 상태의 물리 네임태그 QR을 스캔하거나, 토큰을 직접 입력하세요.</p>
              </div>

              <QRScanner onScan={handleTagScan} isPaused={bindNameTag.isPending} className="mx-auto max-w-sm" />

              <div className="mt-4 flex items-center gap-2">
                <input
                  value={tagDraft}
                  onChange={(event) => setTagDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleTagScan(tagDraft)
                  }}
                  placeholder="네임태그 토큰 직접 입력(폴백)"
                  className={`${fieldControlClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => handleTagScan(tagDraft)}
                  disabled={!tagDraft.trim() || bindNameTag.isPending}
                  className="h-11 shrink-0 bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  바인딩
                </button>
              </div>

              {bindNameTag.isPending && <p className="mt-3 text-xs text-muted">처리 중...</p>}
              {tagError && <p className="mt-3 text-xs font-medium text-danger">{tagError}</p>}
            </div>
          ) : (
            <div className={`border p-5 ${bindOutcome.checkinMethod === 'REISSUE' ? 'border-warning bg-warning/10' : 'border-success bg-success/10'}`}>
              <div className="text-sm font-bold text-ink">체크인 완료</div>
              <p className="mt-1.5 text-xs leading-relaxed text-ink">
                {bindOutcome.gateEntryRecorded
                  ? 'GATE ENTRY가 기록되었습니다.'
                  : '이전 네임태그는 회수(REVOKED)되었습니다. GATE ENTRY는 새로 기록되지 않습니다.'}
              </p>
              <button
                type="button"
                onClick={handleRegisterNext}
                className="mt-4 flex h-11 items-center justify-center bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
              >
                다음 방문자 등록
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
