import { useEffect, useState } from 'react'
import { Field, fieldControlClass } from '../../components/Field'
import { useCurrentExhibition } from '../../features/exhibition/hooks'
import { useExportReservationAttendees, useReservationAttendeeExportPreview } from '../../features/reservation/hooks'
import { useTicketTypes } from '../../features/ticketType/hooks'
import type { ReservationAttendeeExportFilters } from '../../lib/api/reservations'
import type { CheckinStatus, MovementMode, ReservationStatus } from '../../types'

type StatusFilter = 'ALL' | ReservationStatus
type CheckinFilter = 'ALL' | CheckinStatus
type MovementFilter = 'ALL' | MovementMode

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'PENDING', label: '미결제' },
  { value: 'PAID', label: '결제완료' },
  { value: 'CHECKED_IN', label: '입장완료' },
  { value: 'CANCELLED', label: '취소' },
  { value: 'REFUNDED', label: '환불' },
]

const CHECKIN_OPTIONS: Array<{ value: CheckinFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'NOT_CHECKED_IN', label: '미입장' },
  { value: 'CHECKED_IN', label: '입장완료' },
]

const MOVEMENT_OPTIONS: Array<{ value: MovementFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'INDIVIDUAL', label: '개인' },
  { value: 'GROUP', label: '그룹' },
]

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

export default function ReservationExportPage() {
  const exhibition = useCurrentExhibition()
  const exhibitionId = exhibition.data?.id ?? null
  const ticketTypes = useTicketTypes(exhibitionId)

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [checkinStatus, setCheckinStatus] = useState<CheckinFilter>('ALL')
  const [movementMode, setMovementMode] = useState<MovementFilter>('ALL')
  const [ticketTypeName, setTicketTypeName] = useState('ALL')

  const filters: ReservationAttendeeExportFilters = {
    fromDate: fromDate || null,
    toDate: toDate || null,
    status,
    checkinStatus,
    movementMode,
    ticketTypeName,
  }

  const preview = useReservationAttendeeExportPreview(exhibitionId, filters)
  const exportMutation = useExportReservationAttendees()

  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const rowCount = preview.data?.length ?? 0

  function handleDownload() {
    if (exhibitionId === null) return
    exportMutation.mutate(
      { exhibitionId, filters },
      {
        onSuccess: (result) => {
          setToast(`${result.rowCount.toLocaleString()}명 명단을 ${result.fileName}로 내보냈습니다.`)
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">명단 추출</h1>
        <p className="mt-1 text-sm text-muted">참석자(reservation_attendee) 단위로 행사 전체 명단을 내보냅니다.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="flex flex-col gap-5 border border-line bg-white p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="기간(시작)" id="export-from-date" hint="예약일시 기준">
              <input
                id="export-from-date"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className={fieldControlClass}
              />
            </Field>
            <Field label="기간(종료)" id="export-to-date">
              <input
                id="export-to-date"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className={fieldControlClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="예약 상태" id="export-status">
              <select
                id="export-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as StatusFilter)}
                className={fieldControlClass}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="체크인 상태" id="export-checkin-status">
              <select
                id="export-checkin-status"
                value={checkinStatus}
                onChange={(event) => setCheckinStatus(event.target.value as CheckinFilter)}
                className={fieldControlClass}
              >
                {CHECKIN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="이동모드" id="export-movement-mode">
              <select
                id="export-movement-mode"
                value={movementMode}
                onChange={(event) => setMovementMode(event.target.value as MovementFilter)}
                className={fieldControlClass}
              >
                {MOVEMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="티켓" id="export-ticket-type" hint={ticketTypes.isError ? '티켓 목록을 불러오지 못했습니다.' : undefined}>
              <select
                id="export-ticket-type"
                value={ticketTypeName}
                onChange={(event) => setTicketTypeName(event.target.value)}
                disabled={ticketTypes.isLoading}
                className={fieldControlClass}
              >
                <option value="ALL">전체</option>
                {(ticketTypes.data ?? []).map((ticketType) => (
                  <option key={ticketType.id} value={ticketType.name}>
                    {ticketType.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="flex flex-col gap-4 border border-line bg-white p-5">
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted">미리보기</div>

          {preview.isLoading ? (
            <p className="text-sm text-muted">집계 중...</p>
          ) : preview.isError ? (
            <p className="text-sm text-danger">집계를 불러오지 못했습니다.</p>
          ) : rowCount === 0 ? (
            <p className="text-sm text-muted">조건에 맞는 참석자가 없습니다.</p>
          ) : (
            <div>
              <div className="text-3xl font-extrabold leading-none tracking-tight text-ink">
                {rowCount.toLocaleString()}
                <span className="ml-1 text-sm font-semibold text-muted">명</span>
              </div>
              <p className="mt-1.5 text-xs text-muted">현재 조건에 맞는 참석자 수(목 데이터 기준)</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleDownload}
            disabled={exhibitionId === null || exportMutation.isPending || rowCount === 0}
            className="flex h-11 items-center justify-center gap-2 bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-muted"
          >
            {exportMutation.isPending ? (
              <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />
            ) : (
              <DownloadIcon />
            )}
            엑셀 다운로드
          </button>

          {exportMutation.isError && <p className="text-xs font-medium text-danger">다운로드 중 오류가 발생했습니다. 다시 시도해주세요.</p>}
        </div>
      </div>

      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center" role="status">
          <div className="flex items-center gap-2 bg-ink px-4 py-3 text-sm font-semibold text-white shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  )
}
