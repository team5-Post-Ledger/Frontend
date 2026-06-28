import { Link } from 'react-router'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { usePlatformExhibitions } from '../../features/platform/hooks'
import type { PlatformExhibitionSummary } from '../../features/platform/api'
import { formatDateRange } from '../../lib/format'
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

function DisabledActionButton({ children }: { children: string }) {
  return (
    <button
      type="button"
      disabled
      title="다음 PR에서 구현 예정"
      className="px-2.5 py-1.5 text-xs font-bold text-muted ring-1 ring-line disabled:cursor-not-allowed disabled:opacity-55"
    >
      {children}
    </button>
  )
}

const columns: DataTableColumn<PlatformExhibitionSummary>[] = [
  {
    key: 'title',
    header: '행사명',
    sortable: true,
    render: (row) => (
      <div className="min-w-[220px]">
        <div className="font-bold text-ink">{row.title}</div>
        <div className="mt-1 text-xs text-muted">ID {row.id}</div>
      </div>
    ),
  },
  {
    key: 'slug',
    header: 'slug',
    sortable: true,
    render: (row) => <span className="font-mono text-xs text-muted">{row.slug}</span>,
  },
  {
    key: 'venue',
    header: '장소',
    sortable: true,
    render: (row) => <span className="min-w-[160px] text-sm text-ink">{row.venue}</span>,
  },
  {
    key: 'period',
    header: '기간',
    sortable: true,
    sortValue: (row) => row.startDate,
    render: (row) => <span className="whitespace-nowrap text-sm text-ink">{formatDateRange(row.startDate, row.endDate)}</span>,
  },
  {
    key: 'status',
    header: '상태',
    sortable: true,
    align: 'center',
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: 'createdBy',
    header: '생성자',
    sortable: true,
    align: 'right',
    render: (row) => <span className="text-sm text-muted">#{row.createdBy}</span>,
  },
  {
    key: 'actions',
    header: '관리',
    align: 'right',
    render: (row) => (
      <div className="flex min-w-[210px] flex-wrap justify-end gap-2">
        <Link
          to={`/platform/exhibitions/${row.id}`}
          className="px-2.5 py-1.5 text-xs font-bold text-primary ring-1 ring-line transition-colors hover:text-primary-hover hover:ring-primary"
        >
          상세 보기
        </Link>
        <DisabledActionButton>상태 변경</DisabledActionButton>
        <DisabledActionButton>삭제</DisabledActionButton>
      </div>
    ),
  },
]

export default function PlatformExhibitionsPage() {
  const exhibitions = usePlatformExhibitions()
  const data = exhibitions.data ?? []

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-primary">PLATFORM_ADMIN</div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">전체 행사 관리</h1>
          <p className="mt-2 text-sm text-muted">플랫폼 전체 박람회를 생성하고 상태를 관리합니다.</p>
        </div>

        <div className="flex flex-col items-start gap-2 lg:items-end">
          <button
            type="button"
            disabled
            className="bg-primary px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-55"
          >
            행사 생성
          </button>
          <p className="text-xs text-muted">다음 PR에서 구현 예정</p>
        </div>
      </div>

      {exhibitions.isError ? (
        <div className="flex min-h-60 items-center justify-center border border-line bg-white text-sm text-danger">
          행사 목록을 불러오지 못했습니다.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          rowKey={(row) => row.id}
          isLoading={exhibitions.isLoading}
          emptyMessage="등록된 행사가 없습니다."
          pageSize={8}
          toolbar={
            <div className="flex w-full flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-bold text-ink">전체 행사 목록</div>
                <div className="mt-0.5 text-xs text-muted">DRAFT / OPEN / CLOSED 상태를 한 화면에서 확인합니다.</div>
              </div>
              <div className="text-xs font-semibold text-muted">상태 변경과 삭제는 다음 PR에서 구현 예정</div>
            </div>
          }
        />
      )}
    </section>
  )
}
