import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { getCheckinBadge, getCheckinSummary, getPaymentStatusBadge } from '../../features/reservation/displayStatus'
import { getReservationCode } from '../../features/reservation/format'
import { useReservations } from '../../features/reservation/hooks'
import { formatCurrency } from '../../lib/format'
import { useCurrentExhibitionStore } from '../../stores/currentExhibitionStore'
import type { ReservationListItem } from '../../lib/api/reservations'
import type { ReservationStatus } from '../../types'

type PaymentFilter = 'ALL' | ReservationStatus
type CheckinFilter = 'ALL' | 'NONE' | 'PARTIAL' | 'CHECKED_IN'

const PAYMENT_FILTERS: Array<{ value: PaymentFilter; label: string }> = [
  { value: 'ALL', label: '결제상태 전체' },
  { value: 'PENDING', label: '미결제' },
  { value: 'PAID', label: '결제완료' },
  { value: 'CANCELLED', label: '취소' },
  { value: 'REFUNDED', label: '환불' },
]

const CHECKIN_FILTERS: Array<{ value: CheckinFilter; label: string }> = [
  { value: 'ALL', label: '체크인상태 전체' },
  { value: 'NONE', label: '미입장' },
  { value: 'PARTIAL', label: '부분입장' },
  { value: 'CHECKED_IN', label: '입장완료' },
]

function matchesPaymentFilter(status: ReservationStatus, filter: PaymentFilter) {
  if (filter === 'ALL') return true
  if (filter === 'PAID') return status === 'PAID' || status === 'CHECKED_IN'
  return status === filter
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

export default function ReservationsPage() {
  const navigate = useNavigate()
  const exhibitionId = useCurrentExhibitionStore((state) => state.exhibitionId)
  const reservations = useReservations(exhibitionId)
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('ALL')
  const [checkinFilter, setCheckinFilter] = useState<CheckinFilter>('ALL')

  const filtered = useMemo(() => {
    const data = reservations.data ?? []
    const term = searchTerm.trim().toLowerCase()

    return data.filter((item) => {
      if (paymentFilter !== 'ALL' && !matchesPaymentFilter(item.status, paymentFilter)) return false
      if (checkinFilter !== 'ALL' && getCheckinSummary(item) !== checkinFilter) return false
      if (!term) return true
      const haystack = `${item.representativeName} ${item.representativePhone ?? ''} ${getReservationCode(item.id)}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [reservations.data, searchTerm, paymentFilter, checkinFilter])

  const columns: DataTableColumn<ReservationListItem>[] = [
    {
      key: 'code',
      header: '예약번호',
      sortable: true,
      sortValue: (row) => getReservationCode(row.id),
      render: (row) => <span className="font-mono text-xs text-ink">{getReservationCode(row.id)}</span>,
    },
    {
      key: 'representativeName',
      header: '대표자',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-ink">{row.representativeName}</div>
          <div className="mt-0.5 text-xs text-muted">{row.representativePhone}</div>
        </div>
      ),
    },
    { key: 'groupSize', header: '인원', align: 'center', sortable: true },
    {
      key: 'movementMode',
      header: '이동모드',
      render: (row) => (
        <span className={`px-2.5 py-1 text-[11px] font-bold ${row.movementMode === 'GROUP' ? 'bg-ink text-white' : 'bg-line text-muted'}`}>
          {row.movementMode === 'GROUP' ? '그룹' : '개인'}
        </span>
      ),
    },
    {
      key: 'status',
      header: '결제상태',
      render: (row) => {
        const badge = getPaymentStatusBadge(row.status)
        return <span className={`px-2.5 py-1 text-[11px] font-bold ${badge.badgeClassName}`}>{badge.label}</span>
      },
    },
    {
      key: 'checkin',
      header: '체크인',
      render: (row) => {
        const badge = getCheckinBadge(getCheckinSummary(row))
        return <span className={`px-2.5 py-1 text-[11px] font-bold ${badge.badgeClassName}`}>{badge.label}</span>
      },
    },
    {
      key: 'amount',
      header: '금액',
      align: 'right',
      sortable: true,
      render: (row) => formatCurrency(row.amount),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">예약 관리</h1>
          <p className="mt-1 text-sm text-muted">
            총 <b className="text-ink">{(reservations.data?.length ?? 0).toLocaleString()}</b>건 · 표시{' '}
            {filtered.length.toLocaleString()}건
          </p>
        </div>
        <Link
          to="/admin/reservations/export"
          className="flex items-center gap-2 bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
        >
          <DownloadIcon />
          엑셀 추출
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(row) => row.id}
        isLoading={reservations.isLoading}
        isError={reservations.isError}
        emptyMessage="조건에 맞는 예약이 없습니다."
        pageSize={8}
        onRowClick={(row) => navigate(`/admin/reservations/${row.id}`)}
        toolbar={
          <>
            <div className="relative min-w-[220px] flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
                <SearchIcon />
              </span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="이름 · 전화 · 예약번호 검색"
                className="h-10 w-full border border-line bg-surface pl-9 pr-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <select
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value as PaymentFilter)}
              className="h-10 border border-line bg-white px-3 text-sm text-ink outline-none focus:border-primary"
            >
              {PAYMENT_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={checkinFilter}
              onChange={(event) => setCheckinFilter(event.target.value as CheckinFilter)}
              className="h-10 border border-line bg-white px-3 text-sm text-ink outline-none focus:border-primary"
            >
              {CHECKIN_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        }
      />
    </div>
  )
}
