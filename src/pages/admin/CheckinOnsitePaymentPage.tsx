import { useMemo, useState } from 'react'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { getPaymentStatusBadge } from '../../features/reservation/displayStatus'
import { getReservationCode } from '../../features/reservation/format'
import { usePayReservationOnsite, useReservations } from '../../features/reservation/hooks'
import type { ReservationListItem } from '../../lib/api/reservations'
import { formatCurrency, formatDateTime } from '../../lib/format'

interface PaidReceipt {
  pgTxId: string
  paidAt: string
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function CheckinOnsitePaymentPage() {
  const reservations = useReservations()
  const payOnsite = usePayReservationOnsite()

  const [searchTerm, setSearchTerm] = useState('')
  const [selected, setSelected] = useState<ReservationListItem | null>(null)
  const [paidReceipt, setPaidReceipt] = useState<PaidReceipt | null>(null)

  const pendingReservations = useMemo(() => (reservations.data ?? []).filter((item) => item.status === 'PENDING'), [reservations.data])

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return pendingReservations
    return pendingReservations.filter((item) =>
      `${item.representativeName} ${item.representativePhone ?? ''} ${getReservationCode(item.id)}`.toLowerCase().includes(term),
    )
  }, [pendingReservations, searchTerm])

  function handleRowClick(row: ReservationListItem) {
    setSelected(row)
    setPaidReceipt(null)
  }

  function handleConfirmPayment() {
    if (!selected || payOnsite.isPending) return
    payOnsite.mutate(selected.id, {
      onSuccess: (updated) => {
        setSelected(updated)
        if (updated.payment) {
          setPaidReceipt({ pgTxId: updated.payment.pgTxId, paidAt: updated.payment.paidAt ?? new Date().toISOString() })
        }
      },
    })
  }

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
    { key: 'groupSize', header: '인원', align: 'center', sortable: true, render: (row) => `${row.groupSize}명` },
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
      key: 'amount',
      header: '결제예정금액',
      align: 'right',
      sortable: true,
      render: (row) => formatCurrency(row.amount),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">현장 결제</h1>
        <p className="mt-1 text-sm text-muted">미결제(PENDING) 예약을 조회해 금액을 확인하고 현장 결제를 기록합니다.</p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(row) => row.id}
            isLoading={reservations.isLoading}
            isError={reservations.isError}
            emptyMessage="미결제 예약이 없습니다."
            pageSize={8}
            onRowClick={handleRowClick}
            toolbar={
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
            }
          />
        </div>

        {selected && (
          <div className="w-full shrink-0 border border-line bg-white lg:sticky lg:top-6 lg:w-[380px]">
            <div className="flex items-start justify-between gap-3 border-b border-line p-5">
              <div>
                <div className="font-mono text-xs text-muted">{getReservationCode(selected.id)}</div>
                <div className="mt-1 text-lg font-extrabold tracking-tight text-ink">{selected.representativeName}</div>
                <div className="mt-0.5 text-xs text-muted">{selected.representativePhone}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="닫기"
                className="flex h-7 w-7 shrink-0 items-center justify-center border border-line text-muted transition-colors hover:border-primary hover:text-primary"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="p-5">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted">예약 정보</div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
                <dt className="text-muted">이동모드</dt>
                <dd className="font-semibold text-ink">{selected.movementMode === 'GROUP' ? '그룹' : '개인'}</dd>
                <dt className="text-muted">인원</dt>
                <dd className="font-semibold text-ink">{selected.groupSize}명</dd>
                <dt className="text-muted">슬롯</dt>
                <dd className="text-ink">{selected.slotLabel}</dd>
                <dt className="text-muted">예약경로</dt>
                <dd className="text-ink">{selected.reservationSource === 'ONLINE' ? '온라인 예약' : '현장 접수'}</dd>
                <dt className="text-muted">예약일시</dt>
                <dd className="text-ink">{formatDateTime(selected.createdAt)}</dd>
                <dt className="text-muted">상태</dt>
                <dd>
                  {(() => {
                    const badge = getPaymentStatusBadge(selected.status)
                    return <span className={`px-2.5 py-1 text-[11px] font-bold ${badge.badgeClassName}`}>{badge.label}</span>
                  })()}
                </dd>
              </dl>
            </div>

            <div className="border-t border-line p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted">결제 예정 금액</span>
                <span className="text-lg font-extrabold text-ink">{formatCurrency(selected.amount)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">참석자 {selected.groupSize}명 기준</p>

              {!paidReceipt ? (
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={selected.status !== 'PENDING' || payOnsite.isPending}
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {payOnsite.isPending && <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />}
                  현장 결제 확인
                </button>
              ) : (
                <div className="mt-4 border border-success bg-success/10 p-4">
                  <div className="text-sm font-bold text-ink">결제 완료</div>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
                    <dt className="text-muted">결제수단</dt>
                    <dd className="text-ink">현장 결제(ONSITE)</dd>
                    <dt className="text-muted">승인번호</dt>
                    <dd className="font-mono text-ink">{paidReceipt.pgTxId}</dd>
                    <dt className="text-muted">결제일시</dt>
                    <dd className="text-ink">{formatDateTime(paidReceipt.paidAt)}</dd>
                  </dl>
                </div>
              )}

              {payOnsite.isError && <p className="mt-3 text-xs font-medium text-danger">결제 기록 중 오류가 발생했습니다. 다시 시도해주세요.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
