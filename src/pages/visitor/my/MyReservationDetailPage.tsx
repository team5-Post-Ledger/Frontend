import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { DetailLayout } from '../../../components/DetailLayout'
import { QrPlaceholder } from '../../../components/QrPlaceholder'
import {
  canCancelAttendee,
  canCancelReservation,
  getAttendeeCancelBlockReason,
  getReservationCancelBlockReason,
} from '../../../features/myReservation/cancelEligibility'
import { useCancelReservation, useCancelReservationAttendees, useMyReservation } from '../../../features/myReservation/hooks'
import { isReportAvailable } from '../../../features/myReport/reportEligibility'
import { getCheckinBadge, getCheckinSummary, getPaymentStatusBadge } from '../../../features/reservation/displayStatus'
import { getReservationCode } from '../../../features/reservation/format'
import type { MyReservation, MyReservationAttendee } from '../../../lib/api/myReservations'
import { formatCurrency } from '../../../lib/format'

function BackIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function AttendeeRow({
  reservation,
  attendee,
  selectable,
  selected,
  onToggle,
}: {
  reservation: MyReservation
  attendee: MyReservationAttendee
  selectable: boolean
  selected: boolean
  onToggle: () => void
}) {
  const isCancelled = attendee.attendeeStatus === 'CANCELLED'
  const blockReason = getAttendeeCancelBlockReason(reservation, attendee)

  return (
    <div className={`flex items-center gap-3.5 border border-line p-3.5 ${isCancelled ? 'opacity-50' : ''}`}>
      <QrPlaceholder token={attendee.ticketQrToken} size={64} />
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-sm font-bold text-ink">{attendee.name}</span>
          {attendee.isGroupLeader && <span className="bg-ink px-2 py-0.5 text-[10px] font-bold text-white">대표</span>}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted">
            {isCancelled ? '취소됨' : attendee.checkinStatus === 'CHECKED_IN' ? '입장완료' : '미입장'}
          </span>
          <span className="bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted">
            {attendee.nameTagIssued ? '네임태그 발급' : '네임태그 미발급'}
          </span>
          {blockReason && <span className="text-[11px] text-muted">{blockReason}</span>}
        </div>
      </div>
      {selectable && (
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={selected}
          aria-label={`${attendee.name} 선택`}
          className={`flex h-6 w-6 shrink-0 items-center justify-center border ${
            selected ? 'border-primary bg-primary text-white' : 'border-line bg-white text-transparent'
          }`}
        >
          <CheckIcon />
        </button>
      )}
    </div>
  )
}

export default function MyReservationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const reservationId = id ? Number(id) : null

  const reservation = useMyReservation(reservationId)
  const cancelReservationMutation = useCancelReservation()
  const cancelAttendeesMutation = useCancelReservationAttendees()

  const [confirmingFullCancel, setConfirmingFullCancel] = useState(false)
  const [partialCancelMode, setPartialCancelMode] = useState(false)
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<number[]>([])

  if (reservationId === null) {
    return <p className="p-6 text-sm text-danger">잘못된 예약 경로입니다.</p>
  }

  if (reservation.isLoading) {
    return <p className="p-6 text-sm text-muted">불러오는 중...</p>
  }

  if (reservation.isError || !reservation.data) {
    return (
      <div className="p-6">
        <p className="text-sm text-danger">예약을 찾을 수 없습니다.</p>
        <Link to="/my/reservations" className="mt-2 inline-block text-sm font-semibold text-primary hover:text-primary-hover">
          내 예약 목록으로 →
        </Link>
      </div>
    )
  }

  const data = reservation.data
  const checkinBadge = getCheckinBadge(getCheckinSummary(data))
  const payBadge = getPaymentStatusBadge(data.status)
  const eligibleAttendeeIds = data.attendees.filter((attendee) => canCancelAttendee(data, attendee)).map((attendee) => attendee.id)
  const canFullCancel = canCancelReservation(data)
  const canPartialCancel = data.movementMode === 'INDIVIDUAL' && data.status === 'PAID' && eligibleAttendeeIds.length > 0
  const reservationCancelBlockReason = getReservationCancelBlockReason(data)

  function toggleAttendeeSelected(attendeeId: number) {
    setSelectedAttendeeIds((prev) => (prev.includes(attendeeId) ? prev.filter((value) => value !== attendeeId) : [...prev, attendeeId]))
  }

  function exitPartialCancelMode() {
    setPartialCancelMode(false)
    setSelectedAttendeeIds([])
  }

  function handleConfirmFullCancel() {
    cancelReservationMutation.mutate(data.id, { onSuccess: () => setConfirmingFullCancel(false) })
  }

  function handleConfirmPartialCancel() {
    if (selectedAttendeeIds.length === 0) return
    cancelAttendeesMutation.mutate({ reservationId: data.id, attendeeIds: selectedAttendeeIds }, { onSuccess: exitPartialCancelMode })
  }

  const actionPanel = (
    <div className="flex flex-col gap-2.5">
      {confirmingFullCancel ? (
        <div className="flex flex-col gap-2">
          <p className="text-center text-xs text-muted">예약을 전체 취소하고 환불 처리할까요?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmingFullCancel(false)}
              className="flex h-12 flex-1 items-center justify-center border border-line text-sm font-bold text-ink transition-colors hover:border-primary"
            >
              아니요
            </button>
            <button
              type="button"
              onClick={handleConfirmFullCancel}
              disabled={cancelReservationMutation.isPending}
              className="flex h-12 flex-1 items-center justify-center bg-danger text-sm font-bold text-white transition-colors disabled:cursor-default disabled:bg-muted"
            >
              {cancelReservationMutation.isPending ? '처리 중...' : '취소 확인'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmingFullCancel(true)}
          disabled={!canFullCancel}
          className="flex h-12 items-center justify-center border border-line text-sm font-bold text-danger transition-colors hover:border-danger disabled:cursor-default disabled:text-muted"
        >
          예약 전체 취소
        </button>
      )}
      {!confirmingFullCancel && reservationCancelBlockReason && (
        <p className="text-center text-[11px] text-muted">{reservationCancelBlockReason}</p>
      )}

      {data.movementMode === 'INDIVIDUAL' ? (
        <>
          <button
            type="button"
            onClick={partialCancelMode ? handleConfirmPartialCancel : () => setPartialCancelMode(true)}
            disabled={!canPartialCancel || cancelAttendeesMutation.isPending}
            className="flex h-12 items-center justify-center border border-line text-sm font-bold text-ink transition-colors hover:border-primary disabled:cursor-default disabled:text-muted"
          >
            {cancelAttendeesMutation.isPending
              ? '처리 중...'
              : partialCancelMode
                ? `선택한 ${selectedAttendeeIds.length}명 취소`
                : '참석자 부분 취소'}
          </button>
          {partialCancelMode && (
            <button type="button" onClick={exitPartialCancelMode} className="text-center text-xs font-semibold text-muted hover:text-ink">
              선택 해제
            </button>
          )}
        </>
      ) : (
        <>
          <button type="button" disabled className="flex h-12 items-center justify-center border border-line text-sm font-bold text-muted">
            참석자 부분 취소
          </button>
          <p className="text-center text-[11px] text-muted">
            그룹 예약은 대표 QR로 함께 이동하므로 참석자 단위 부분취소가 제한됩니다. 인원을 줄이려면 고객센터로 예약 인원(group_size) 조정을 요청해 주세요.
          </p>
        </>
      )}
    </div>
  )

  return (
    <div className="mx-auto w-full max-w-md p-5 pb-56 lg:max-w-5xl lg:p-8 lg:pb-8">
      <Link to="/my/reservations" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <BackIcon /> 내 예약
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <DetailLayout
            title={data.exhibitionTitle}
            subtitle={`${data.exhibitionVenue} · ${data.slotLabel}`}
            badge={<span className={`px-2.5 py-1 text-[11px] font-bold ${payBadge.badgeClassName}`}>{payBadge.label}</span>}
            actions={
              isReportAvailable(data) ? (
                <Link
                  to={`/my/reservations/${data.id}/report`}
                  className="flex h-9 items-center gap-1.5 border border-line px-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
                >
                  방문 리포트 보기
                </Link>
              ) : undefined
            }
            attributes={[
              { label: '예약번호', value: <span className="font-mono text-xs">{getReservationCode(data.id)}</span> },
              { label: '인원', value: `${data.groupSize}명` },
              {
                label: '이동방식',
                value: (
                  <span className={`px-2 py-0.5 text-[11px] font-bold ${data.movementMode === 'GROUP' ? 'bg-ink text-white' : 'bg-line text-muted'}`}>
                    {data.movementMode}
                  </span>
                ),
              },
              {
                label: '체크인',
                value: <span className={`px-2 py-0.5 text-[11px] font-bold ${checkinBadge.badgeClassName}`}>{checkinBadge.label}</span>,
              },
              { label: '결제 금액', value: formatCurrency(data.paymentAmount) },
              ...(data.refundedAmount > 0 ? [{ label: '환불액', value: formatCurrency(data.refundedAmount) }] : []),
            ]}
          >
            <div>
              <div className="mb-3 text-base font-bold text-ink">참석자 · {data.attendees.length}명</div>
              <div className="flex flex-col gap-3">
                {data.attendees.map((attendee) => (
                  <AttendeeRow
                    key={attendee.id}
                    reservation={data}
                    attendee={attendee}
                    selectable={partialCancelMode && canCancelAttendee(data, attendee)}
                    selected={selectedAttendeeIds.includes(attendee.id)}
                    onToggle={() => toggleAttendeeSelected(attendee.id)}
                  />
                ))}
              </div>
            </div>
          </DetailLayout>
        </div>

        {/* lg+: 우측 sticky 결제·환불 요약 패널 */}
        <aside className="hidden lg:block lg:w-[300px] lg:shrink-0">
          <div className="border border-line bg-white p-5 lg:sticky lg:top-20">
            <div className="text-sm font-bold text-ink">결제 · 환불</div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              결제 금액 {formatCurrency(data.paymentAmount)} · {payBadge.label}
              {data.refundedAmount > 0 && <> · 환불 {formatCurrency(data.refundedAmount)}</>}
            </p>
            <div className="mt-4">{actionPanel}</div>
          </div>
        </aside>
      </div>

      {/* lg 미만: 핸드오프 위치(하단) 고정 액션 바 */}
      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-line bg-white p-4 lg:hidden">{actionPanel}</div>
    </div>
  )
}
