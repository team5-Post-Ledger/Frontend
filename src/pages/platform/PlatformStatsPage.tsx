import { Link } from 'react-router'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import type { PlatformExhibitionStatsSummary } from '../../features/platform/api'
import { usePlatformStatsOverview } from '../../features/platform/hooks'
import { formatCurrency, formatDateRange } from '../../lib/format'
import type { ExhibitionStatus } from '../../types'

const STATUS_BADGE: Record<ExhibitionStatus, { label: string; className: string }> = {
  DRAFT: { label: 'DRAFT', className: 'bg-warning text-white' },
  OPEN: { label: 'OPEN', className: 'bg-live text-ink' },
  CLOSED: { label: 'CLOSED', className: 'bg-line text-muted' },
}

function StatusBadge({ status }: { status: ExhibitionStatus }) {
  const badge = STATUS_BADGE[status]
  return <span className={`inline-flex px-2.5 py-1 text-xs font-bold ${badge.className}`}>{badge.label}</span>
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <section className="border border-line bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <strong className="mt-2 block text-2xl font-semibold text-foreground">{value}</strong>
    </section>
  )
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-white p-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-2 text-lg font-bold text-ink">{value}</p>
    </div>
  )
}

const columns: DataTableColumn<PlatformExhibitionStatsSummary>[] = [
  {
    key: 'title',
    header: '행사명',
    sortable: true,
    render: (row) => (
      <div className="min-w-[220px]">
        <div className="font-bold text-ink">{row.title}</div>
        <div className="mt-1 text-xs text-muted">ID {row.exhibitionId}</div>
      </div>
    ),
  },
  {
    key: 'status',
    header: '상태',
    sortable: true,
    align: 'center',
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: 'period',
    header: '기간',
    sortable: true,
    sortValue: (row) => row.startDate,
    render: (row) => <span className="whitespace-nowrap text-sm text-ink">{formatDateRange(row.startDate, row.endDate)}</span>,
  },
  {
    key: 'grossAmount',
    header: '매출',
    sortable: true,
    align: 'right',
    render: (row) => <span className="font-semibold text-ink">{formatCurrency(row.grossAmount)}</span>,
  },
  {
    key: 'visitorCount',
    header: '방문 인원',
    sortable: true,
    align: 'right',
    render: (row) => `${row.visitorCount.toLocaleString()}명`,
  },
  {
    key: 'reservationCount',
    header: '예약 수',
    sortable: true,
    align: 'right',
    render: (row) => `${row.reservationCount.toLocaleString()}건`,
  },
  {
    key: 'adRevenue',
    header: '광고 수익',
    sortable: true,
    align: 'right',
    render: (row) => <span className="font-semibold text-ink">{formatCurrency(row.adRevenue)}</span>,
  },
  {
    key: 'actions',
    header: '상세',
    align: 'right',
    render: (row) => (
      <Link
        to={`/platform/exhibitions/${row.exhibitionId}`}
        className="px-2.5 py-1.5 text-xs font-bold text-primary ring-1 ring-line transition-colors hover:text-primary-hover hover:ring-primary"
      >
        상세 이동
      </Link>
    ),
  },
]

export default function PlatformStatsPage() {
  const statsQuery = usePlatformStatsOverview()
  const data = statsQuery.data
  const summaries = data?.exhibitionSummaries ?? []

  const chartData = summaries.map((summary) => ({
    name: summary.title,
    revenue: summary.grossAmount,
  }))

  return (
    <section className="space-y-6">
      <div className="border-b border-line pb-5">
        <div className="text-xs font-bold uppercase tracking-wider text-primary">PLATFORM_ADMIN</div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">통합 통계</h1>
        <p className="mt-2 text-sm text-muted">
          전체 행사 매출, 방문, 광고 성과를 한 곳에서 확인합니다.
        </p>
      </div>

      {statsQuery.isError ? (
        <div className="flex min-h-60 items-center justify-center border border-line bg-white text-sm text-danger">
          통합 통계를 불러오지 못했습니다.
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="전체 행사 수" value={`${data?.exhibitionCount ?? 0}개`} />
            <SummaryCard label="총매출" value={formatCurrency(data?.grossAmount ?? 0)} />
            <SummaryCard label="총 방문 인원" value={`${(data?.visitorCount ?? 0).toLocaleString()}명`} />
            <SummaryCard label="광고 수익" value={formatCurrency(data?.adRevenue ?? 0)} />
          </div>

          <section className="border border-line bg-surface p-4">
            <div>
              <h2 className="text-sm font-bold text-ink">운영 지표 요약</h2>
              <p className="mt-1 text-xs text-muted">매출, 정산, 광고 성과를 플랫폼 전체 기준으로 봅니다.</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricItem label="온라인 매출" value={formatCurrency(data?.onlineAmount ?? 0)} />
              <MetricItem label="현장 매출" value={formatCurrency(data?.onsiteAmount ?? 0)} />
              <MetricItem label="수수료" value={formatCurrency(data?.feeAmount ?? 0)} />
              <MetricItem label="순지급액" value={formatCurrency(data?.netPayout ?? 0)} />
              <MetricItem label="활성 광고 수" value={`${data?.activeAdCount ?? 0}개`} />
              <MetricItem label="총 노출수" value={(data?.adImpressions ?? 0).toLocaleString()} />
              <MetricItem label="총 클릭수" value={(data?.adClicks ?? 0).toLocaleString()} />
              <MetricItem label="예약 수" value={`${(data?.reservationCount ?? 0).toLocaleString()}건`} />
            </div>
          </section>

          <section className="border border-line bg-white p-4">
            <div>
              <h2 className="text-sm font-bold text-ink">행사별 매출 비교</h2>
              <p className="mt-1 text-xs text-muted">행사별 총매출을 비교합니다.</p>
            </div>
            {statsQuery.isLoading ? (
              <div className="mt-4 flex h-72 items-center justify-center text-sm text-muted">통계를 불러오는 중입니다.</div>
            ) : chartData.length === 0 ? (
              <div className="mt-4 flex h-72 items-center justify-center text-sm text-muted">표시할 통계 데이터가 없습니다.</div>
            ) : (
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 20 }}>
                    <CartesianGrid stroke="var(--color-line)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={0} height={48} />
                    <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000000)}백만`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="revenue" fill="var(--color-primary)" radius={0} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <DataTable
            columns={columns}
            data={summaries}
            rowKey={(row) => row.exhibitionId}
            isLoading={statsQuery.isLoading}
            emptyMessage="표시할 통계 데이터가 없습니다."
            pageSize={8}
            toolbar={
              <div>
                <div className="text-sm font-bold text-ink">행사별 요약</div>
                <div className="mt-0.5 text-xs text-muted">매출, 방문, 예약, 광고 수익을 행사별로 비교합니다.</div>
              </div>
            }
          />
        </>
      )}
    </section>
  )
}
