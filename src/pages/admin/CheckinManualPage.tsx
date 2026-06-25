import type { FormEvent } from 'react'
import { useState } from 'react'
import { Field, fieldControlClass } from '../../components/Field'
import { QRScanner } from '../../components/QRScanner'
import { Stepper, type StepperStep } from '../../components/Stepper'
import { useBindNameTag, useSearchAttendees } from '../../features/checkin/hooks'
import type { AttendeeSearchCandidate } from '../../lib/api/checkin'
import type { CheckinMethod } from '../../types'

const STEPS: StepperStep[] = [
  { key: 'search', label: '참석자 조회' },
  { key: 'nametag', label: '네임태그 바인딩' },
]

interface BindOutcome {
  checkinMethod: CheckinMethod
  gateEntryRecorded: boolean
}

function CandidateCard({ candidate, onSelect }: { candidate: AttendeeSearchCandidate; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center justify-between gap-3 border border-line bg-white p-4 text-left transition-colors hover:border-primary"
    >
      <div className="min-w-0">
        <div className="text-sm font-bold text-ink">{candidate.name}</div>
        <div className="mt-1 text-xs text-muted">
          {candidate.phone} · {candidate.reservationCode}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="bg-surface px-2 py-0.5 text-[11px] font-bold text-ink">
          {candidate.movementMode === 'GROUP' ? `그룹 ${candidate.groupSize}명` : '개인'}
        </span>
        {candidate.checkinStatus === 'CHECKED_IN' && <span className="bg-warning px-2 py-0.5 text-[11px] font-bold text-white">이미 체크인</span>}
      </div>
    </button>
  )
}

export default function CheckinManualPage() {
  const [phase, setPhase] = useState<'search' | 'nametag'>('search')

  const [nameInput, setNameInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<AttendeeSearchCandidate[] | null>(null)

  const [selected, setSelected] = useState<AttendeeSearchCandidate | null>(null)
  const [memo, setMemo] = useState('')
  const [tagDraft, setTagDraft] = useState('')
  const [tagError, setTagError] = useState<string | null>(null)
  const [bindOutcome, setBindOutcome] = useState<BindOutcome | null>(null)

  const searchAttendees = useSearchAttendees()
  const bindNameTag = useBindNameTag()

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!nameInput.trim() && !phoneInput.trim() && !codeInput.trim()) {
      setSearchError('이름, 전화번호, 예약번호 중 하나 이상 입력해주세요.')
      return
    }
    setSearchError(null)
    searchAttendees.mutate(
      { name: nameInput.trim() || undefined, phone: phoneInput.trim() || undefined, reservationCode: codeInput.trim() || undefined },
      {
        onSuccess: (result) => setCandidates(result),
        onError: () => setSearchError('조회 중 오류가 발생했습니다. 다시 시도해주세요.'),
      },
    )
  }

  function handleSelectCandidate(candidate: AttendeeSearchCandidate) {
    setSelected(candidate)
    setMemo('')
    setTagDraft('')
    setTagError(null)
    setBindOutcome(null)
    setPhase('nametag')
  }

  function handleBackToSearch() {
    setPhase('search')
    setSelected(null)
    setTagDraft('')
    setTagError(null)
    setBindOutcome(null)
  }

  function handleTagScan(rawToken: string) {
    const token = rawToken.trim()
    if (!selected || !token || bindNameTag.isPending) return

    setTagError(null)
    bindNameTag.mutate(
      {
        attendeeId: selected.attendeeId,
        nameTagToken: token,
        options: { checkinMethod: 'MANUAL_SEARCH', memo: memo.trim() || undefined },
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

  function handleScanNext() {
    setPhase('search')
    setNameInput('')
    setPhoneInput('')
    setCodeInput('')
    setSearchError(null)
    setCandidates(null)
    setSelected(null)
    setMemo('')
    setTagDraft('')
    setTagError(null)
    setBindOutcome(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">수기 체크인</h1>
        <p className="mt-1 text-sm text-muted">이름·전화·예약번호로 참석자를 조회한 뒤, 네임태그 QR을 바인딩합니다.</p>
      </div>

      <div className="border border-line bg-white p-5">
        <Stepper steps={STEPS} currentStep={phase === 'search' ? 0 : 1} />
      </div>

      {phase === 'search' && (
        <div className="flex flex-col gap-4">
          <form onSubmit={handleSearch} className="border border-line bg-white p-5">
            <div className="mb-4">
              <div className="text-sm font-bold text-ink">① 참석자 조회</div>
              <p className="mt-1 text-xs text-muted">이름만으로는 동명이인이 나올 수 있습니다 — 전화번호 뒷자리나 예약번호로 좁혀보세요.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="이름" id="search-name">
                <input
                  id="search-name"
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                  placeholder="예: 김민준"
                  className={fieldControlClass}
                />
              </Field>
              <Field label="전화번호" id="search-phone" hint="뒷자리만 입력해도 됩니다.">
                <input
                  id="search-phone"
                  value={phoneInput}
                  onChange={(event) => setPhoneInput(event.target.value)}
                  placeholder="예: 7733"
                  className={fieldControlClass}
                />
              </Field>
              <Field label="예약번호" id="search-code" hint="예: R-481">
                <input
                  id="search-code"
                  value={codeInput}
                  onChange={(event) => setCodeInput(event.target.value)}
                  placeholder="예: R-481"
                  className={fieldControlClass}
                />
              </Field>
            </div>

            <button
              type="submit"
              disabled={searchAttendees.isPending}
              className="mt-4 flex h-11 items-center justify-center gap-2 bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-default disabled:bg-muted"
            >
              {searchAttendees.isPending && <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />}
              조회
            </button>

            {searchError && <p className="mt-3 text-xs font-medium text-danger">{searchError}</p>}
          </form>

          {candidates !== null && (
            <div className="border border-line bg-white p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm font-bold text-ink">조회 결과 · {candidates.length}건</div>
                {candidates.length > 1 && <span className="text-xs text-muted">동명이인일 수 있습니다. 전화·예약번호를 확인하세요.</span>}
              </div>

              {candidates.length === 0 ? (
                <div style={{ height: 120 }} className="flex items-center justify-center text-sm text-muted">
                  조건에 맞는 참석자가 없습니다. 검색어를 확인해주세요.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {candidates.map((candidate) => (
                    <CandidateCard key={candidate.attendeeId} candidate={candidate} onSelect={() => handleSelectCandidate(candidate)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {phase === 'nametag' && selected && (
        <div className="flex flex-col gap-4">
          <div className="border border-line bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-bold text-ink">{selected.name}</div>
                <div className="mt-1 text-xs text-muted">
                  {selected.phone} · {selected.reservationCode}
                </div>
              </div>
              <button type="button" onClick={handleBackToSearch} className="shrink-0 text-xs font-semibold text-muted transition-colors hover:text-ink">
                ← 다른 후보 선택
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="bg-surface px-2.5 py-1 text-[11px] font-bold text-ink">{selected.movementMode === 'GROUP' ? '그룹' : '개인'}</span>
              {selected.movementMode === 'GROUP' && selected.isGroupLeader && (
                <span className="bg-surface px-2.5 py-1 text-[11px] font-bold text-ink">대표(리더)</span>
              )}
              <span className="bg-surface px-2.5 py-1 text-[11px] font-bold text-ink">{selected.groupSize}명</span>
            </div>

            {selected.movementMode === 'GROUP' && (
              <p className="mt-3 border border-line bg-surface p-3 text-xs leading-relaxed text-muted">
                그룹 예약입니다. 대표 1명만 네임태그를 바인딩하며, 입장 시 head_count {selected.groupSize}명으로 기록됩니다.
              </p>
            )}

            {selected.checkinStatus === 'CHECKED_IN' && (
              <p className="mt-3 border border-warning bg-warning/10 p-3 text-xs font-semibold leading-relaxed text-ink">
                이미 체크인된 참석자입니다. 네임태그를 바인딩하면 분실/교환 재바인딩(REISSUE)으로 처리되며 GATE ENTRY는 새로
                기록되지 않습니다.
              </p>
            )}
          </div>

          {!bindOutcome ? (
            <div className="border border-line bg-white p-5">
              <div className="mb-4">
                <div className="text-sm font-bold text-ink">② 네임태그 바인딩</div>
                <p className="mt-1 text-xs text-muted">AVAILABLE 상태의 물리 네임태그 QR을 스캔하거나, 토큰을 직접 입력하세요.</p>
              </div>

              <Field label="메모" id="checkin-memo" hint="수기 처리 사유 등을 남기면 checkin_log에 함께 기록됩니다(선택).">
                <input
                  id="checkin-memo"
                  value={memo}
                  onChange={(event) => setMemo(event.target.value)}
                  placeholder="예: QR 인식 불가로 수기 확인"
                  className={fieldControlClass}
                />
              </Field>

              <div className="mt-4">
                <QRScanner onScan={handleTagScan} isPaused={bindNameTag.isPending} className="mx-auto max-w-sm" />
              </div>

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
                다음 참석자 조회
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
