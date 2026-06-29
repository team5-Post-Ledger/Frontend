import { useState } from 'react'
import type { SettlementStatus } from '../../types'
import { useGenerateSettlement, useSettlements } from '../../features/settlements/hooks'
import { listPlatformExhibitions } from '../../features/platform/api'
import { useQuery } from '@tanstack/react-query'

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

const ALL_STATUSES: SettlementStatus[] = ['PENDING', 'CONFIRMED', 'PAID_OUT']

function formatAmount(n: number) {
  return n.toLocaleString() + '원'
}

function formatDate(d: string) {
  return d.replace(/-/g, '.')
}

// ── 정산 생성 모달 ──────────────────────────────────────────────────────────
interface GenerateModalProps {
  onClose: () => void
}

function GenerateModal({ onClose }: GenerateModalProps) {
  const exhibitionsQuery = useQuery({
    queryKey: ['platform', 'exhibitions'],
    queryFn: () => listPlatformExhibitions(),
  })
  const generate = useGenerateSettlement()

  const [exhibitionId, setExhibitionId] = useState<number | ''>('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [fieldError, setFieldError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (exhibitionId === '') {
      setFieldError('행사를 선택해 주세요.')
      return
    }
    if (!periodStart || !periodEnd) {
      setFieldError('정산 기간을 입력해 주세요.')
      return
    }
    if (periodEnd < periodStart) {
      setFieldError('종료일이 시작일보다 앞설 수 없습니다.')
      return
    }
    setFieldError('')
    generate.mutate(
      { exhibitionId: exhibitionId as number, periodStart, periodEnd },
      { onSuccess: onClose },
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md border border-line bg-white shadow-lg">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-base font-extrabold text-ink">정산 생성</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex flex-col gap-4">
            {/* 행사 선택 */}
            <div>
              <label htmlFor="modal-exhibition" className="mb-1.5 block text-xs font-semibold text-ink">
                행사 <span className="text-danger">*</span>
              </label>
              {exhibitionsQuery.isLoading ? (
                <p className="text-sm text-muted">불러오는 중...</p>
              ) : exhibitionsQuery.isError ? (
                <p className="text-sm text-danger">행사 목록을 불러오지 못했습니다.</p>
              ) : (
                <select
                  id="modal-exhibition"
                  value={exhibitionId}
                  onChange={(e) => setExhibitionId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-line bg-white px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
                >
                  <option value="">행사를 선택하세요</option>
                  {exhibitionsQuery.data?.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 정산 기간 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="modal-period-start" className="mb-1.5 block text-xs font-semibold text-ink">
                  시작일 <span className="text-danger">*</span>
                </label>
                <input
                  id="modal-period-start"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full border border-line px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="modal-period-end" className="mb-1.5 block text-xs font-semibold text-ink">
                  종료일 <span className="text-danger">*</span>
                </label>
                <input
                  id="modal-period-end"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full border border-line px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* 정산 공식 안내 */}
            <div className="border border-line bg-surface px-4 py-3 text-xs text-muted leading-relaxed">
              총매출 = 온라인 + 현장 &nbsp;·&nbsp; 순지급액 = 총매출 − 수수료 + 광고수익
            </div>

            {/* 필드 오류 */}
            {fieldError && (
              <p className="text-xs font-semibold text-danger">{fieldError}</p>
            )}

            {/* 서버 오류 */}
            {generate.isError && (
              <p className="text-xs font-semibold text-danger">
                정산 생성에 실패했습니다. 다시 시도해 주세요.
              </p>
            )}
          </div>

          {/* 액션 */}
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={generate.isPending}
              className="bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {generate.isPending ? '생성 중...' : '정산 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── 메인 페이지 ─────────────────────────────────────────────────────────────
export default function SettlementsPage() {
  const exhibitionsQuery = useQuery({
    queryKey: ['platform', 'exhibitions'],
    queryFn: () => listPlatformExhibitions(),
  })

  const [filterExhibitionId, setFilterExhibitionId] = useState<number | undefined>(undefined)
  const [filterStatus, setFilterStatus] = useState<SettlementStatus | undefined>(undefined)
  const [showModal, setShowModal] = useState(false)

  const { data: settlements, isLoading, isError } = useSettlements({
    exhibitionId: filterExhibitionId,
    status: filterStatus,
  })

  return (
    <>
      {/* 페이지 헤더 */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">정산 목록</h1>
          <p className="mt-0.5 text-xs text-muted">박람회별 정산 내역을 조회합니다.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="shrink-0 bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          + 정산 생성
        </button>
      </div>

      {/* 필터 바 */}
      <div className="mb-4 flex flex-wrap gap-2">
        {/* 행사 필터 */}
        <select
          value={filterExhibitionId ?? ''}
          onChange={(e) =>
            setFilterExhibitionId(e.target.value === '' ? undefined : Number(e.target.value))
          }
          className="border border-line bg-white px-3 py-1.5 text-sm text-ink focus:border-primary focus:outline-none"
        >
          <option value="">전체 행사</option>
          {exhibitionsQuery.data?.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.title}
            </option>
          ))}
        </select>

        {/* 상태 필터 */}
        <div className="flex">
          <button
            type="button"
            onClick={() => setFilterStatus(undefined)}
            className={[
              'border-y border-l border-line px-3 py-1.5 text-sm font-semibold transition-colors',
              filterStatus === undefined
                ? 'bg-primary text-white'
                : 'bg-white text-muted hover:text-ink',
            ].join(' ')}
          >
            전체
          </button>
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={[
                'border-y border-r border-line px-3 py-1.5 text-sm font-semibold transition-colors',
                filterStatus === s
                  ? 'bg-primary text-white'
                  : 'bg-white text-muted hover:text-ink',
              ].join(' ')}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted">불러오는 중...</p>
      ) : isError ? (
        <p className="py-10 text-center text-sm text-danger">
          정산 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : settlements?.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm font-semibold text-ink">정산 내역이 없습니다.</p>
          <p className="mt-1 text-xs text-muted">
            정산 생성 버튼을 눌러 새 정산을 만들어 주세요.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="py-2.5 pr-4 text-left text-xs font-bold uppercase tracking-wide text-muted">
                  행사명
                </th>
                <th className="py-2.5 pr-4 text-left text-xs font-bold uppercase tracking-wide text-muted">
                  정산 기간
                </th>
                <th className="py-2.5 pr-4 text-right text-xs font-bold uppercase tracking-wide text-muted">
                  총매출
                </th>
                <th className="py-2.5 pr-4 text-right text-xs font-bold uppercase tracking-wide text-muted">
                  순지급액
                </th>
                <th className="py-2.5 text-left text-xs font-bold uppercase tracking-wide text-muted">
                  상태
                </th>
              </tr>
            </thead>
            <tbody>
              {settlements?.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-line last:border-0"
                >
                  <td className="py-3 pr-4">
                    <span className="font-semibold text-ink">{s.exhibitionTitle}</span>
                  </td>
                  <td className="py-3 pr-4 text-muted">
                    {formatDate(s.periodStart)} – {formatDate(s.periodEnd)}
                  </td>
                  <td className="py-3 pr-4 text-right font-semibold text-ink tabular-nums">
                    {formatAmount(s.grossAmount)}
                  </td>
                  <td className="py-3 pr-4 text-right font-extrabold text-ink tabular-nums">
                    {formatAmount(s.netPayout)}
                  </td>
                  <td className="py-3">
                    <span
                      className={[
                        'inline-block px-2 py-0.5 text-xs font-bold',
                        STATUS_BADGE_CLASS[s.status],
                      ].join(' ')}
                    >
                      {STATUS_LABELS[s.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 정산 생성 모달 */}
      {showModal && <GenerateModal onClose={() => setShowModal(false)} />}
    </>
  )
}
