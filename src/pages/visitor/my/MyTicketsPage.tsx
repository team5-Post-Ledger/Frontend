import { useState } from 'react'
import { QrPlaceholder } from '../../../components/QrPlaceholder'
import { QueryState } from '../../../components/QueryState'
import { useMyReservations } from '../../../features/myReservation/hooks'
import { getReservationCode } from '../../../features/reservation/format'
import type { MyReservation, MyReservationAttendee } from '../../../lib/api/myReservations'

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

function TicketCard({ reservation, attendee }: { reservation: MyReservation; attendee: MyReservationAttendee }) {
  const [justCopied, setJustCopied] = useState(false)

  async function handleShare() {
    const text = `${attendee.name}님의 FairPilot 모바일 티켓\n${reservation.exhibitionTitle} · ${reservation.slotLabel}\n예약번호 ${getReservationCode(reservation.id)}`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'FairPilot 모바일 티켓', text })
      } catch {
        // 사용자가 공유를 취소한 경우 등은 무시한다.
      }
      return
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      setJustCopied(true)
      setTimeout(() => setJustCopied(false), 2000)
    }
  }

  return (
    <div className="w-[85%] shrink-0 snap-center border border-line bg-white lg:w-full">
      <div className="border-b border-dashed border-line px-[18px] pt-[18px] pb-[10px] text-center">
        <div className="text-xs text-muted">FairPilot 모바일 티켓</div>
        <div className="mt-1 text-base font-extrabold text-ink">{reservation.exhibitionTitle}</div>
      </div>
      <div className="flex flex-col items-center px-[18px] py-6">
        <QrPlaceholder token={attendee.ticketQrToken} size={190} />
        <div className="mt-[18px] flex items-center gap-2">
          <span className="text-lg font-extrabold text-ink">{attendee.name}</span>
          {attendee.isGroupLeader && <span className="bg-ink px-2 py-0.5 text-[10px] font-bold text-white">대표</span>}
        </div>
        <div className="mt-1 text-xs text-muted">{reservation.slotLabel}</div>
        <button
          type="button"
          onClick={handleShare}
          className="mt-[18px] flex h-11 w-full items-center justify-center gap-2 border border-line text-sm font-semibold text-ink transition-colors hover:border-primary"
        >
          <ShareIcon />
          {justCopied ? '링크 복사됨' : '공유'}
        </button>
      </div>
    </div>
  )
}

export default function MyTicketsPage() {
  const reservations = useMyReservations()

  const ticketGroups = (reservations.data ?? [])
    .filter((reservation) => reservation.status === 'PAID' || reservation.status === 'CHECKED_IN')
    .map((reservation) => ({
      reservation,
      attendees: reservation.attendees.filter((attendee) => attendee.attendeeStatus === 'ACTIVE' && attendee.ticketQrToken),
    }))
    .filter((group) => group.attendees.length > 0)

  return (
    <QueryState
      isLoading={reservations.isLoading}
      isError={reservations.isError}
      isEmpty={ticketGroups.length === 0}
      emptyMessage="발급된 티켓이 없습니다."
    >
      <div className="flex flex-col gap-8">
        {ticketGroups.map(({ reservation, attendees }) => (
          <div key={reservation.id}>
            <div className="mb-3 text-sm font-semibold text-muted">
              {reservation.exhibitionTitle} · 참석자 {attendees.length}명
            </div>
            <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0 xl:grid-cols-3">
              {attendees.map((attendee) => (
                <TicketCard key={attendee.id} reservation={reservation} attendee={attendee} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </QueryState>
  )
}
