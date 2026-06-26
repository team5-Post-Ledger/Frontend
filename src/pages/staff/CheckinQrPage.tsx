import { useState } from 'react'
import { fieldControlClass } from '../../components/Field'
import { QRScanner } from '../../components/QRScanner'
import { Stepper, type StepperStep } from '../../components/Stepper'
import { useBindNameTag, useVerifyTicketQr } from '../../features/checkin/hooks'
import type { TicketVerifyResult } from '../../lib/api/checkin'
import { useStaffExhibitionStore } from '../../stores/staffExhibitionStore'
import type { CheckinMethod } from '../../types'

const STEPS: StepperStep[] = [
  { key: 'ticket', label: '티켓 확인' },
  { key: 'nametag', label: '네임태그 바인딩' },
]

interface BindOutcome {
  checkinMethod: CheckinMethod
  gateEntryRecorded: boolean
}

export default function CheckinQrPage() {
  const exhibitionId = useStaffExhibitionStore((state) => state.exhibitionId)

  const [step, setStep] = useState<'ticket' | 'nametag'>('ticket')
  const [attendee, setAttendee] = useState<TicketVerifyResult | null>(null)
  const [ticketDraft, setTicketDraft] = useState('')
  const [ticketError, setTicketError] = useState<string | null>(null)
  const [tagDraft, setTagDraft] = useState('')
  const [tagError, setTagError] = useState<string | null>(null)
  const [bindOutcome, setBindOutcome] = useState<BindOutcome | null>(null)

  const verifyTicket = useVerifyTicketQr(exhibitionId)
  const bindNameTag = useBindNameTag(exhibitionId)

  function handleTicketScan(rawToken: string) {
    const token = rawToken.trim()
    if (!token || verifyTicket.isPending) return

    setTicketError(null)
    verifyTicket.mutate(token, {
      onSuccess: (result) => {
        if (!result) {
          setTicketError('유효하지 않은 티켓 QR입니다. 예약을 확인해주세요.')
          return
        }
        setAttendee(result)
        setStep('nametag')
        setTicketDraft('')
      },
      onError: () => setTicketError('확인 중 오류가 발생했습니다. 다시 시도해주세요.'),
    })
  }

  function handleTagScan(rawToken: string) {
    const token = rawToken.trim()
    if (!attendee || !token || bindNameTag.isPending) return

    setTagError(null)
    bindNameTag.mutate(
      { attendeeId: attendee.attendeeId, nameTagToken: token, options: { reservationId: attendee.reservationId } },
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

  function handleBackToTicket() {
    setStep('ticket')
    setAttendee(null)
    setTagDraft('')
    setTagError(null)
    setBindOutcome(null)
  }

  function handleScanNext() {
    setStep('ticket')
    setAttendee(null)
    setTicketError(null)
    setTagDraft('')
    setTagError(null)
    setBindOutcome(null)
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">QR 체크인</h1>
        <p className="mt-1 text-sm text-muted">모바일 티켓 QR을 먼저 확인한 뒤, 물리 네임태그 QR을 스캔해 바인딩합니다.</p>
      </div>

      <div className="border border-line bg-white p-5">
        <Stepper steps={STEPS} currentStep={step === 'ticket' ? 0 : 1} />
      </div>

      {step === 'ticket' && (
        <div className="border border-line bg-white p-5">
          <div className="mb-4">
            <div className="text-sm font-bold text-ink">① 모바일 티켓 QR 스캔</div>
            <p className="mt-1 text-xs text-muted">참석자의 모바일 티켓 QR을 스캔하거나, 카메라가 없으면 토큰을 직접 입력하세요.</p>
          </div>

          <QRScanner onScan={handleTicketScan} isPaused={verifyTicket.isPending} className="mx-auto max-w-sm" />

          <div className="mt-4 flex items-center gap-2">
            <input
              value={ticketDraft}
              onChange={(event) => setTicketDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleTicketScan(ticketDraft)
              }}
              placeholder="예: TICKET-QR-004 (직접 입력 폴백)"
              className={`${fieldControlClass} flex-1`}
            />
            <button
              type="button"
              onClick={() => handleTicketScan(ticketDraft)}
              disabled={!ticketDraft.trim() || verifyTicket.isPending}
              className="h-11 shrink-0 bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              확인
            </button>
          </div>

          {verifyTicket.isPending && <p className="mt-3 text-xs text-muted">확인 중...</p>}
          {ticketError && <p className="mt-3 text-xs font-medium text-danger">{ticketError}</p>}
        </div>
      )}

      {step === 'nametag' && attendee && (
        <div className="flex flex-col gap-4">
          <div className="border border-line bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-bold text-ink">{attendee.name}</div>
                <div className="mt-1 text-xs text-muted">{attendee.phone}</div>
              </div>
              <button
                type="button"
                onClick={handleBackToTicket}
                className="shrink-0 text-xs font-semibold text-muted transition-colors hover:text-ink"
              >
                ← 다시 티켓 확인
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="bg-surface px-2.5 py-1 text-[11px] font-bold text-ink">
                {attendee.movementMode === 'GROUP' ? '그룹' : '개인'}
              </span>
              {attendee.movementMode === 'GROUP' && attendee.isGroupLeader && (
                <span className="bg-surface px-2.5 py-1 text-[11px] font-bold text-ink">대표(리더)</span>
              )}
              <span className="bg-surface px-2.5 py-1 text-[11px] font-bold text-ink">{attendee.groupSize}명</span>
            </div>

            {attendee.movementMode === 'GROUP' && (
              <p className="mt-3 border border-line bg-surface p-3 text-xs leading-relaxed text-muted">
                그룹 예약입니다. 대표 1명만 네임태그를 바인딩하며, 입장 시 head_count {attendee.groupSize}명으로 기록됩니다.
              </p>
            )}

            {attendee.checkinStatus === 'CHECKED_IN' && (
              <p className="mt-3 border border-warning bg-warning/10 p-3 text-xs font-semibold leading-relaxed text-ink">
                이미 체크인된 참석자입니다. 네임태그를 스캔하면 분실/교환 재바인딩(REISSUE)으로 처리되며 GATE ENTRY는 새로
                기록되지 않습니다.
              </p>
            )}
          </div>

          {!bindOutcome ? (
            <div className="border border-line bg-white p-5">
              <div className="mb-4">
                <div className="text-sm font-bold text-ink">② 네임태그 QR 스캔</div>
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
            <div
              className={`border p-5 ${bindOutcome.checkinMethod === 'REISSUE' ? 'border-warning bg-warning/10' : 'border-success bg-success/10'}`}
            >
              <div className="text-sm font-bold text-ink">
                {bindOutcome.checkinMethod === 'REISSUE' ? '네임태그 재발급 완료' : '체크인 완료'}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-ink">
                {bindOutcome.gateEntryRecorded
                  ? 'GATE ENTRY가 기록되었습니다.'
                  : '이전 네임태그는 회수(REVOKED)되었습니다. GATE ENTRY는 새로 기록되지 않습니다.'}
              </p>
              <button
                type="button"
                onClick={handleScanNext}
                className="mt-4 flex h-11 items-center justify-center bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
              >
                다음 참석자 스캔
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
