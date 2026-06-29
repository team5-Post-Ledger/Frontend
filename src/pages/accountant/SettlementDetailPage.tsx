import { Link, useParams } from 'react-router'
import type { SettlementStatus } from '../../types'
import {
  useConfirmSettlement,
  useExportSettlement,
  usePayoutSettlement,
  useSettlement,
} from '../../features/settlements/hooks'

const STATUS_LABELS: Record<SettlementStatus, string> = {
  PENDING: '대기',
  CONFIRMED: '확정',
  PAID_OUT: '지급완료',
}

const STATUS_BADGE_CLASS: Record<SettlementStatus, string> = {
  PENDING: 'bg-surface border border-warning text-warning',
  CONFIRMED: 'bg-surface border border-primary text-primary',
  PAID_OUT: 'bg-surface border border-success text-success',
}

function formatAmount(n: number) {
  return n.toLocaleString() + '원'
}

function formatDate(d: string) {
  return d.replace(/-/g, '.')
}

function formatDateTime(dt: string) {
  return dt.replace('T', ' ').slice(0, 16)
}

export default function SettlementDetailPage() {
  const { id } = useParams<{ id: string }>()
  const settlementId = Number(id)

  const { data: settlement, isLoading, isError } = useSettlement(settlementId)
  const confirm = useConfirmSettlement()
  const payout = usePayoutSettlement()
  const exportMut = useExportSettlement()

  if (isLoading) {
    return <p className="py-10 text-center text-sm text-muted">불러오는 중...</p>
  }

  if (isError || !settlement) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm font-semibold text-danger">정산을 불러오지 못했습니다.</p>
        <Link
          to="/settlements"
          className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
        >
          ← 목록으로 돌아가기
        </Link>
      </div>
    )
  }

  const { status } = settlement
  const isActionPending = confirm.isPending || payout.isPending
  const actionError = confirm.error ?? payout.error

  return (
    <>
      {/* 페이지 헤더 */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/settlements"
            className="mb-1.5 inline-block text-xs font-semibold text-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
          >
            ← 정산 목록
          </Link>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">
            {settlement.exhibitionTitle}
          </h1>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className={[
                'inline-block px-2 py-0.5 text-xs font-bold',
                STATUS_BADGE_CLASS[status],
              ].join(' ')}
            >
              {STATUS_LABELS[status]}
            </span>
            <span className="text-xs text-muted">정산 #{settlement.id}</span>
          </div>
        </div>

        {/* 다운로드 버튼 — 상태 무관 노출 */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={exportMut.isPending}
            onClick={() => exportMut.mutate({ id: settlementId, format: 'xlsx' })}
            className="border border-line px-3 py-2 text-sm font-semibold text-muted transition-colors hover:border-ink hover:text-ink disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primary"
          >
            xlsx 다운로드
          </button>
          <button
            type="button"
            disabled={exportMut.isPending}
            onClick={() => exportMut.mutate({ id: settlementId, format: 'pdf' })}
            className="border border-line px-3 py-2 text-sm font-semibold text-muted transition-colors hover:border-ink hover:text-ink disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primary"
          >
            pdf 다운로드
          </button>
        </div>
      </div>

      {/* 액션 버튼 — 상태머신대로만
          PENDING: [확정] 노출, [지급] 없음
          CONFIRMED: [지급] 노출, [확정] 없음
          PAID_OUT: 둘 다 없음 (읽기 전용) */}
      {status !== 'PAID_OUT' && (
        <div className="mb-6 flex items-center gap-3">
          {status === 'PENDING' && (
            <button
              type="button"
              disabled={isActionPending}
              onClick={() => confirm.mutate(settlementId)}
              className="bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {confirm.isPending ? '처리 중...' : '확정'}
            </button>
          )}
          {status === 'CONFIRMED' && (
            <button
              type="button"
              disabled={isActionPending}
              onClick={() => payout.mutate(settlementId)}
              className="bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {payout.isPending ? '처리 중...' : '지급'}
            </button>
          )}
          {actionError && (
            <p className="text-xs font-semibold text-danger">
              {actionError instanceof Error ? actionError.message : '오류가 발생했습니다.'}
            </p>
          )}
        </div>
      )}

      {exportMut.error && (
        <p className="mb-4 text-xs font-semibold text-danger">
          다운로드에 실패했습니다. 다시 시도해 주세요.
        </p>
      )}

      {/* 정산 기간·시각 정보 */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="border border-line bg-surface px-4 py-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">
            정산 기간
          </div>
          <div className="text-sm font-semibold text-ink">
            {formatDate(settlement.periodStart)} – {formatDate(settlement.periodEnd)}
          </div>
        </div>
        <div className="border border-line bg-surface px-4 py-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">
            생성 시각
          </div>
          <div className="text-sm font-semibold text-ink">
            {formatDateTime(settlement.generatedAt)}
          </div>
        </div>
        {settlement.paidOutAt && (
          <div className="border border-line bg-surface px-4 py-3">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">
              지급 완료 시각
            </div>
            <div className="text-sm font-semibold text-success">
              {formatDateTime(settlement.paidOutAt)}
            </div>
          </div>
        )}
      </div>

      {/* 금액 분해 — 응답값 그대로 표시(화면에서 재계산 없음) */}
      <div className="border border-line">
        <div className="border-b border-line px-5 py-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">금액 내역</span>
        </div>
        <dl className="divide-y divide-line">
          <div className="flex items-center justify-between px-5 py-3.5">
            <dt className="text-sm font-semibold text-ink">총매출</dt>
            <dd className="text-sm font-semibold text-ink tabular-nums">
              {formatAmount(settlement.grossAmount)}
            </dd>
          </div>
          <div className="flex items-center justify-between bg-surface px-5 py-3">
            <dt className="pl-4 text-xs text-muted">온라인 결제</dt>
            <dd className="text-xs text-muted tabular-nums">
              {formatAmount(settlement.onlineAmount)}
            </dd>
          </div>
          <div className="flex items-center justify-between bg-surface px-5 py-3">
            <dt className="pl-4 text-xs text-muted">현장 결제</dt>
            <dd className="text-xs text-muted tabular-nums">
              {formatAmount(settlement.onsiteAmount)}
            </dd>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <dt className="text-sm font-semibold text-ink">수수료</dt>
            <dd className="text-sm font-semibold text-danger tabular-nums">
              −{formatAmount(settlement.feeAmount)}
            </dd>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <dt className="text-sm font-semibold text-ink">광고수익</dt>
            <dd className="text-sm font-semibold text-success tabular-nums">
              +{formatAmount(settlement.adRevenue)}
            </dd>
          </div>
          <div className="flex items-center justify-between bg-shell px-5 py-4">
            <dt className="text-sm font-bold text-white">순지급액</dt>
            <dd className="text-lg font-extrabold text-white tabular-nums">
              {formatAmount(settlement.netPayout)}
            </dd>
          </div>
        </dl>
      </div>
    </>
  )
}
