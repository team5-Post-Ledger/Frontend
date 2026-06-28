import { Link, useParams } from 'react-router'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { QueryState } from '../../components/QueryState'
import type { PlatformUserSummary } from '../../features/platform/api'
import { usePlatformExhibition, usePlatformExhibitionAdmins } from '../../features/platform/hooks'
import { formatDateRange } from '../../lib/format'
import type { ExhibitionStatus } from '../../types'

const STATUS_BADGE: Record<ExhibitionStatus, { label: string; className: string }> = {
  DRAFT: { label: 'DRAFT', className: 'bg-warning text-white' },
  OPEN: { label: 'OPEN', className: 'bg-live text-ink' },
  CLOSED: { label: 'CLOSED', className: 'bg-line text-muted' },
}

const adminColumns: DataTableColumn<PlatformUserSummary>[] = [
  {
    key: 'name',
    header: '이름',
    sortable: true,
    render: (row) => (
      <div>
        <div className="font-bold text-ink">{row.name}</div>
        <div className="mt-1 text-xs text-muted">{row.email}</div>
      </div>
    ),
  },
  {
    key: 'phone',
    header: '연락처',
    render: (row) => <span className="text-sm text-muted">{row.phone ?? '-'}</span>,
  },
  {
    key: 'role',
    header: '역할',
    align: 'center',
    render: (row) => <span className="px-2.5 py-1 text-xs font-bold text-primary ring-1 ring-line">{row.role}</span>,
  },
  {
    key: 'active',
    header: '상태',
    align: 'center',
    render: (row) => <span className="text-sm font-semibold text-ink">{row.active ? '활성' : '비활성'}</span>,
  },
]

function StatusBadge({ status }: { status: ExhibitionStatus }) {
  const badge = STATUS_BADGE[status]
  return <span className={`inline-flex px-2.5 py-1 text-xs font-bold ${badge.className}`}>{badge.label}</span>
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border border-line bg-white p-4">
      <dt className="text-xs font-bold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-2 text-sm font-semibold text-ink">{value}</dd>
    </div>
  )
}

export default function PlatformExhibitionDetailPage() {
  const params = useParams()
  const exhibitionId = params.id ? Number(params.id) : null
  const validExhibitionId = Number.isFinite(exhibitionId) ? exhibitionId : null

  const exhibition = usePlatformExhibition(validExhibitionId)
  const admins = usePlatformExhibitionAdmins(exhibition.data?.id ?? null)
  const data = exhibition.data

  if (exhibition.isLoading) {
    return <QueryState isLoading isError={false} height={320}> </QueryState>
  }

  if (exhibition.isError) {
    return (
      <section className="space-y-5">
        <Link to="/platform/exhibitions" className="text-sm font-bold text-primary transition-colors hover:text-primary-hover">
          전체 행사로 돌아가기
        </Link>
        <div className="flex min-h-60 items-center justify-center border border-line bg-white text-sm text-danger">
          행사 상세 정보를 불러오지 못했습니다.
        </div>
      </section>
    )
  }

  if (!data) {
    return (
      <section className="space-y-5">
        <Link to="/platform/exhibitions" className="text-sm font-bold text-primary transition-colors hover:text-primary-hover">
          전체 행사로 돌아가기
        </Link>
        <div className="flex min-h-60 items-center justify-center border border-line bg-white text-sm text-muted">
          행사를 찾을 수 없습니다.
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link to="/platform/exhibitions" className="text-sm font-bold text-primary transition-colors hover:text-primary-hover">
            전체 행사로 돌아가기
          </Link>
          <div className="mt-4 text-xs font-bold uppercase tracking-wider text-primary">PLATFORM_ADMIN</div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">{data.title}</h1>
          <p className="mt-2 text-sm text-muted">행사 기본 정보와 관리자 배정 상태를 확인합니다.</p>
        </div>

        <div className="flex flex-col items-start gap-2 lg:items-end">
          <button
            type="button"
            disabled
            className="bg-primary px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-55"
          >
            관리자 배정
          </button>
          <p className="text-xs text-muted">EXPO_ADMIN 배정 기능은 다음 단계에서 구현됩니다.</p>
        </div>
      </div>

      <section>
        <h2 className="text-base font-extrabold text-ink">기본 정보</h2>
        <dl className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <InfoItem label="행사명" value={data.title} />
          <InfoItem label="slug" value={<span className="font-mono text-xs">{data.slug}</span>} />
          <InfoItem label="장소" value={data.venue} />
          <InfoItem label="주소" value={data.address} />
          <InfoItem label="기간" value={formatDateRange(data.startDate, data.endDate)} />
          <InfoItem label="상태" value={<StatusBadge status={data.status} />} />
          <InfoItem label="생성자" value={`#${data.createdBy}`} />
        </dl>
      </section>

      <section>
        <h2 className="text-base font-extrabold text-ink">통합 상태 요약</h2>
        <div className="mt-3 border border-line bg-surface p-5">
          <p className="text-sm text-muted">다음 PR에서 통합 상태 요약을 연결합니다.</p>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-extrabold text-ink">관리자 배정</h2>
            <p className="mt-1 text-sm text-muted">EXPO_ADMIN 배정 기능은 다음 단계에서 구현됩니다.</p>
          </div>
        </div>

        <DataTable
          columns={adminColumns}
          data={admins.data ?? []}
          rowKey={(row) => row.id}
          isLoading={admins.isLoading}
          isError={admins.isError}
          emptyMessage="배정된 EXPO_ADMIN이 없습니다."
          pageSize={5}
        />
      </section>
    </section>
  )
}
