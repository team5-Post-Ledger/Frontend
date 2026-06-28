import { DataTable, type DataTableColumn } from '../../components/DataTable'
import type { PlatformUserSummary } from '../../features/platform/api'
import { usePlatformAdmins, usePlatformExhibitions } from '../../features/platform/hooks'

function formatAssignedExhibitions(admin: PlatformUserSummary, exhibitionTitles: Map<number, string>) {
  if (admin.assignedExhibitionIds.length === 0) {
    return '미배정'
  }

  return admin.assignedExhibitionIds
    .map((id) => exhibitionTitles.get(id) ?? `#${id}`)
    .join(', ')
}

export default function PlatformAdminsPage() {
  const adminsQuery = usePlatformAdmins()
  const exhibitionsQuery = usePlatformExhibitions()

  const admins = (adminsQuery.data ?? []).filter((admin) => admin.role === 'EXPO_ADMIN')
  const exhibitionTitles = new Map(
    (exhibitionsQuery.data ?? []).map((exhibition) => [exhibition.id, exhibition.title]),
  )

  const assignedCount = admins.filter((admin) => admin.assignedExhibitionIds.length > 0).length
  const unassignedCount = admins.length - assignedCount

  const columns: DataTableColumn<PlatformUserSummary>[] = [
    {
      key: 'name',
      header: '이름',
      render: (admin) => <span className="font-medium text-foreground">{admin.name}</span>,
    },
    {
      key: 'email',
      header: '이메일',
      render: (admin) => admin.email,
    },
    {
      key: 'phone',
      header: '전화번호',
      render: (admin) => admin.phone ?? '-',
    },
    {
      key: 'assignedExhibitions',
      header: '배정 행사',
      render: (admin) => (
        <span className={admin.assignedExhibitionIds.length === 0 ? 'text-muted' : undefined}>
          {formatAssignedExhibitions(admin, exhibitionTitles)}
        </span>
      ),
    },
    {
      key: 'active',
      header: '상태',
      render: (admin) => (
        <span
          className={[
            'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
            admin.active ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted',
          ].join(' ')}
        >
          {admin.active ? '활성' : '비활성'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '관리',
      render: () => (
        <button
          type="button"
          disabled
          className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-muted"
          title="EXPO_ADMIN 배정 관리는 다음 단계에서 구현됩니다."
        >
          배정 관리
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">EXPO_ADMIN 관리</h1>
          <p className="mt-2 text-sm text-muted">
            박람회 운영 관리자 계정을 발급하고 행사에 배정합니다.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <button
            type="button"
            disabled
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground opacity-60"
          >
            관리자 발급
          </button>
          <p className="text-xs text-muted">다음 PR에서 구현 예정</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <section className="rounded-lg border border-line bg-surface p-4">
          <p className="text-sm text-muted">전체 EXPO_ADMIN 수</p>
          <strong className="mt-2 block text-2xl font-semibold text-foreground">{admins.length}</strong>
        </section>
        <section className="rounded-lg border border-line bg-surface p-4">
          <p className="text-sm text-muted">배정 완료 수</p>
          <strong className="mt-2 block text-2xl font-semibold text-foreground">
            {assignedCount}
          </strong>
        </section>
        <section className="rounded-lg border border-line bg-surface p-4">
          <p className="text-sm text-muted">미배정 수</p>
          <strong className="mt-2 block text-2xl font-semibold text-foreground">
            {unassignedCount}
          </strong>
        </section>
      </div>

      {adminsQuery.isError ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-5 text-sm text-danger">
          관리자 목록을 불러오지 못했습니다.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={admins}
          rowKey={(admin) => admin.id}
          isLoading={adminsQuery.isLoading}
          emptyMessage="등록된 EXPO_ADMIN 계정이 없습니다."
          pageSize={10}
        />
      )}
    </div>
  )
}
