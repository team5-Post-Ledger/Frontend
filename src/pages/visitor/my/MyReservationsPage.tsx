import { Link } from 'react-router'
import { QueryState } from '../../../components/QueryState'
import { getCheckinBadge, getCheckinSummary, getPaymentStatusBadge } from '../../../features/reservation/displayStatus'
import { useMyReservations } from '../../../features/myReservation/hooks'
import type { MyReservation } from '../../../lib/api/myReservations'

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function ReservationCard({ reservation }: { reservation: MyReservation }) {
  const checkinBadge = getCheckinBadge(getCheckinSummary(reservation))
  const payBadge = getPaymentStatusBadge(reservation.status)

  return (
    <Link
      to={`/my/reservations/${reservation.id}`}
      className="block border border-line bg-white transition-colors hover:border-primary"
    >
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="text-[15px] font-bold leading-snug text-ink">{reservation.exhibitionTitle}</div>
          <span className={`shrink-0 px-2.5 py-1 text-[11px] font-bold ${checkinBadge.badgeClassName}`}>{checkinBadge.label}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs text-muted">
            <CalendarIcon />
            {reservation.slotLabel}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <PeopleIcon />
            {reservation.groupSize}명 · {reservation.movementMode}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-line bg-surface px-4 py-2.5">
        <span className={`px-2.5 py-1 text-[11px] font-bold ${payBadge.badgeClassName}`}>{payBadge.label}</span>
        <span className="text-xs font-semibold text-muted">상세 →</span>
      </div>
    </Link>
  )
}

export default function MyReservationsPage() {
  const reservations = useMyReservations()
  const data = reservations.data ?? []

  return (
    <QueryState isLoading={reservations.isLoading} isError={reservations.isError} isEmpty={data.length === 0} emptyMessage="아직 예약 내역이 없습니다.">
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
        {data.map((reservation) => (
          <ReservationCard key={reservation.id} reservation={reservation} />
        ))}
      </div>
    </QueryState>
  )
}
