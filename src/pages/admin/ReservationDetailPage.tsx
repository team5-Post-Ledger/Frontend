import { Link, useParams } from 'react-router'
import { DetailLayout } from '../../components/DetailLayout'
import { QueryState } from '../../components/QueryState'
import { CHECKIN_METHOD_LABEL } from '../../features/checkin/format'
import { getCheckinBadge, getCheckinSummary, getPaymentStatusBadge } from '../../features/reservation/displayStatus'
import { getReservationCode } from '../../features/reservation/format'
import { useReservationDetail } from '../../features/reservation/hooks'
import type { CheckinLogView, ReservationAttendeeView, ReservationListItem } from '../../lib/api/reservations'
import { formatCurrency, formatDateTime } from '../../lib/format'
import type { AttendeeStatus, PaymentStatus } from '../../types'

const ATTENDEE_STATUS_BADGE: Record<AttendeeStatus, { label: string; className: string } | null> = {
  ACTIVE: null,
  CANCELLED: { label: '취소', className: 'bg-line text-muted' },
  NO_SHOW: { label: '노쇼', className: 'bg-warning text-white' },
}

const PAYMENT_RECORD_STATUS_BADGE: Record<PaymentStatus, { label: string; className: string }> = {
  READY: { label: '결제대기', className: 'bg-warning text-white' },
  PAID: { label: '결제완료', className: 'bg-success text-white' },
  FAILED: { label: '결제실패', className: 'bg-danger text-white' },
  CANCELLED: { label: '취소', className: 'bg-line text-muted' },
  REFUNDED: { label: '환불', className: 'bg-line text-muted' },
}

function BackIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function AttendeeRow({ attendee, isGroup }: { attendee: ReservationAttendeeView; isGroup: boolean }) {
  const isLeader = isGroup && attendee.isGroupLeader
  const statusBadge = ATTENDEE_STATUS_BADGE[attendee.attendeeStatus]

  return (
    <div className={`flex items-center gap-3 border p-3 ${isLeader ? 'border-primary bg-primary/5' : 'border-line'}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-surface text-xs font-bold text-muted">
        {attendee.name.slice(0, 1)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">{attendee.name}</span>
          {isLeader && <span className="bg-ink px-2 py-0.5 text-[10px] font-bold text-white">대표</span>}
          {statusBadge && <span className={`px-2 py-0.5 text-[10px] font-bold ${statusBadge.className}`}>{statusBadge.label}</span>}
        </div>
        <div className="mt-0.5 text-xs text-muted">
          {attendee.phone ?? '연락처 미등록'}
          {attendee.checkedInAt ? ` · ${formatDateTime(attendee.checkedInAt)} 입장` : ''}
        </div>
      </div>
      <span
        className={`shrink-0 px-2.5 py-1 text-[10.5px] font-bold ${
          attendee.checkinStatus === 'CHECKED_IN' ? 'bg-success text-white' : 'bg-line text-muted'
        }`}
      >
        {attendee.checkinStatus === 'CHECKED_IN' ? '입장완료' : '미입장'}
      </span>
    </div>
  )
}

function CheckinTimeline({ logs }: { logs: CheckinLogView[] }) {
  const sorted = [...logs].sort((a, b) => a.checkedInAt.localeCompare(b.checkedInAt))

  if (sorted.length === 0) {
    return <p className="text-sm text-muted">체크인 기록이 없습니다.</p>
  }

  return (
    <div className="flex flex-col">
      {sorted.map((log, index) => (
        <div key={log.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
            {index < sorted.length - 1 && <span className="w-px flex-1 bg-line" />}
          </div>
          <div className="pb-4">
            <div className="text-sm font-semibold text-ink">{CHECKIN_METHOD_LABEL[log.checkinMethod]}</div>
            <div className="mt-0.5 text-xs text-muted">
              {formatDateTime(log.checkedInAt)} · {log.processedByName}
            </div>
            <div className="mt-0.5 text-xs text-muted">네임태그 {log.nameTagToken ?? '미지정'}</div>
            {log.memo && <div className="mt-0.5 text-xs text-muted">{log.memo}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

function ReservationDetailView({ data }: { data: ReservationListItem }) {
  const isGroup = data.movementMode === 'GROUP'
  const reservationBadge = getPaymentStatusBadge(data.status)
  const checkinBadge = getCheckinBadge(getCheckinSummary(data))

  return (
    <div className="flex flex-col gap-5">
      <Link to="/admin/reservations" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <BackIcon /> 예약 관리
      </Link>

      <DetailLayout
        title={getReservationCode(data.id)}
        subtitle={`${data.exhibitionTitle} · ${data.slotLabel}`}
        badge={<span className={`px-2.5 py-1 text-[11px] font-bold ${reservationBadge.badgeClassName}`}>{reservationBadge.label}</span>}
        attributes={[
          { label: '예약자', value: `${data.representativeName} (${data.representativePhone ?? '연락처 미등록'})` },
          { label: '티켓', value: data.ticketTypeName },
          {
            label: '이동방식',
            value: (
              <span className={`px-2 py-0.5 text-[11px] font-bold ${isGroup ? 'bg-ink text-white' : 'bg-line text-muted'}`}>
                {isGroup ? '그룹' : '개인'}
              </span>
            ),
          },
          { label: '인원', value: `${data.groupSize}명` },
          { label: '예약경로', value: data.reservationSource === 'ONLINE' ? '온라인 예약' : '현장 접수' },
          {
            label: '체크인 현황',
            value: <span className={`px-2 py-0.5 text-[11px] font-bold ${checkinBadge.badgeClassName}`}>{checkinBadge.label}</span>,
          },
        ]}
      >
        <section className="border border-line bg-white p-5">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted">참석자 · {data.attendees.length}명</div>
          <div className="flex flex-col gap-2">
            {data.attendees.map((attendee) => (
              <AttendeeRow key={attendee.id} attendee={attendee} isGroup={isGroup} />
            ))}
          </div>
        </section>

        <section className="border border-line bg-white p-5">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted">결제</div>
          {data.payment ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
              <dt className="text-muted">결제수단</dt>
              <dd className="text-ink">{data.payment.pgProvider}</dd>
              <dt className="text-muted">결제금액</dt>
              <dd className="font-semibold text-ink">{formatCurrency(data.payment.amount)}</dd>
              <dt className="text-muted">수수료</dt>
              <dd className="text-ink">{formatCurrency(data.payment.feeAmount)}</dd>
              <dt className="text-muted">상태</dt>
              <dd>
                <span className={`px-2 py-0.5 text-[11px] font-bold ${PAYMENT_RECORD_STATUS_BADGE[data.payment.status].className}`}>
                  {PAYMENT_RECORD_STATUS_BADGE[data.payment.status].label}
                </span>
              </dd>
              <dt className="text-muted">결제일시</dt>
              <dd className="text-ink">{data.payment.paidAt ? formatDateTime(data.payment.paidAt) : '-'}</dd>
            </dl>
          ) : (
            <p className="text-sm text-muted">아직 결제되지 않았습니다.</p>
          )}
        </section>

        <section className="border border-line bg-white p-5">
          <div className="mb-3.5 text-[11px] font-bold uppercase tracking-wide text-muted">체크인 로그</div>
          <CheckinTimeline logs={data.checkinLogs} />
        </section>
      </DetailLayout>
    </div>
  )
}

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const reservationId = id ? Number(id) : null

  const reservation = useReservationDetail(reservationId)

  if (reservationId === null) {
    return <p className="text-sm text-danger">잘못된 예약 경로입니다.</p>
  }

  return (
    <QueryState isLoading={reservation.isLoading} isError={reservation.isError} isEmpty={!reservation.data} emptyMessage="해당 예약을 찾을 수 없습니다.">
      {reservation.data && <ReservationDetailView data={reservation.data} />}
    </QueryState>
  )
}
