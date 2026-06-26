import { Link, useParams } from 'react-router'
import { QueryState } from '../../components/QueryState'
import { useReservationCheckinStatus } from '../../features/checkin/hooks'
import type { AttendeeCheckinStatusRow } from '../../lib/api/checkin'
import { formatDateTime } from '../../lib/format'
import type { AttendeeStatus, CheckinStatus } from '../../types'

function maskName(name: string): string {
  if (name.length <= 1) return name
  return name[0] + '*'.repeat(name.length - 1)
}

const CHECKIN_BADGE: Record<CheckinStatus, { label: string; cls: string }> = {
  CHECKED_IN: { label: '체크인 완료', cls: 'bg-success/15 text-success' },
  NOT_CHECKED_IN: { label: '미체크인', cls: 'bg-line text-muted' },
}

const ATTENDEE_STATUS_LABEL: Record<AttendeeStatus, string | null> = {
  ACTIVE: null,
  CANCELLED: '취소됨',
  NO_SHOW: '미도착',
}

function AttendeeRow({ row }: { row: AttendeeCheckinStatusRow }) {
  const badge = CHECKIN_BADGE[row.checkinStatus]
  const inactive = row.attendeeStatus !== 'ACTIVE'
  const inactiveLabel = ATTENDEE_STATUS_LABEL[row.attendeeStatus]

  return (
    <div className={`flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 ${inactive ? 'opacity-50' : ''}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-semibold text-ink">{maskName(row.name)}</span>
          {row.isGroupLeader && (
            <span className="bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">대표</span>
          )}
          {inactiveLabel && (
            <span className="bg-line px-1.5 py-0.5 text-[10px] font-bold text-muted">{inactiveLabel}</span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-muted">
          {row.checkedInAt ? formatDateTime(row.checkedInAt) : '—'}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {row.nameTagIssued && (
          <span className="hidden text-[10px] font-semibold text-muted sm:inline">네임태그 발급</span>
        )}
        <span className={`px-2 py-0.5 text-[11px] font-bold ${badge.cls}`}>{badge.label}</span>
      </div>
    </div>
  )
}

export default function CheckinStatusPage() {
  const { id } = useParams<{ id: string }>()
  const reservationId = id && !Number.isNaN(Number(id)) ? Number(id) : null
  const query = useReservationCheckinStatus(reservationId)
  const status = query.data ?? null

  return (
    <div className="flex flex-col gap-4 p-4">
      <Link to="/checkin/manual" className="text-xs font-semibold text-muted transition-colors hover:text-ink">
        ← 수기 체크인으로 돌아가기
      </Link>

      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">팀 체크인 현황</h1>
        {id && <p className="mt-0.5 text-sm text-muted">예약번호 R-{id}</p>}
      </div>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={status === null}
        emptyMessage="예약을 찾을 수 없습니다."
        height={200}
      >
        {status && (
          <>
            {/* N/M 요약 */}
            <div className="flex items-center gap-4 border border-line bg-white px-5 py-4">
              <div className="leading-none">
                <span className="text-3xl font-extrabold tracking-tight text-ink">{status.checkedInCount}</span>
                <span className="text-lg font-semibold text-muted">/{status.activeCount}</span>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold text-ink">체크인 완료</div>
                <div className="text-xs text-muted">
                  {status.movementMode === 'GROUP' ? '그룹' : '개인'} · 총 {status.groupSize}명
                </div>
              </div>
              <span
                className={`ml-auto shrink-0 px-2.5 py-1 text-xs font-bold ${
                  status.activeCount > 0 && status.checkedInCount === status.activeCount
                    ? 'bg-success/15 text-success'
                    : 'bg-surface text-muted'
                }`}
              >
                {status.activeCount > 0 && status.checkedInCount === status.activeCount ? '전원 완료' : '진행중'}
              </span>
            </div>

            {/* 이동 모드 안내 */}
            {status.movementMode === 'GROUP' ? (
              <div className="border border-primary/20 bg-primary/5 px-4 py-3 text-xs leading-relaxed text-ink">
                <span className="font-bold">그룹 이동</span> — 대표 1명이 네임태그를 바인딩하며 입장 시 head_count = {status.groupSize}명으로 기록됩니다.
                대표가 CHECKED_IN이면 그룹 전체 입장으로 처리됩니다.
              </div>
            ) : (
              <div className="border border-line bg-surface px-4 py-3 text-xs leading-relaxed text-muted">
                <span className="font-bold text-ink">개인 이동</span> — 참석자 {status.groupSize}명이 각자 체크인합니다. 각자의 네임태그 QR을 바인딩해야 합니다.
              </div>
            )}

            {/* 참석자 목록 */}
            <div className="border border-line bg-white">
              <div className="border-b border-line px-4 py-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted">
                  참석자 ({status.attendees.length}명)
                </span>
              </div>
              {status.attendees.map((row) => (
                <AttendeeRow key={row.attendeeId} row={row} />
              ))}
            </div>
          </>
        )}
      </QueryState>
    </div>
  )
}
