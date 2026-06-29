import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { Field, fieldControlClass, fieldControlErrorClass } from '../../components/Field'
import { QueryState } from '../../components/QueryState'
import type { PlatformAdminSummary } from '../../features/platform/api'
import { useAssignPlatformAdmin, usePlatformAdmins, usePlatformExhibition } from '../../features/platform/hooks'
import { formatDateRange } from '../../lib/format'
import type { ExhibitionStatus } from '../../types'

const STATUS_BADGE: Record<ExhibitionStatus, { label: string; className: string }> = {
  DRAFT: { label: 'DRAFT', className: 'bg-warning text-white' },
  OPEN: { label: 'OPEN', className: 'bg-live text-ink' },
  CLOSED: { label: 'CLOSED', className: 'bg-line text-muted' },
}

interface AssignmentFormValues {
  adminId: string
}

type AssignmentFormErrors = Partial<Record<keyof AssignmentFormValues, string>>

const INITIAL_ASSIGNMENT_FORM_VALUES: AssignmentFormValues = {
  adminId: '',
}

const adminColumns: DataTableColumn<PlatformAdminSummary>[] = [
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
    render: (row) => <span className="text-sm font-semibold text-ink">{row.isActive ? '활성' : '비활성'}</span>,
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
  const adminsQuery = usePlatformAdmins()
  const assignAdmin = useAssignPlatformAdmin()
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false)
  const [assignmentValues, setAssignmentValues] = useState<AssignmentFormValues>(INITIAL_ASSIGNMENT_FORM_VALUES)
  const [assignmentErrors, setAssignmentErrors] = useState<AssignmentFormErrors>({})
  const data = exhibition.data

  const expoAdmins = (adminsQuery.data ?? []).filter((admin) => admin.role === 'EXPO_ADMIN')
  const assignedAdmins = data
    ? expoAdmins.filter((admin) => admin.assignedExhibitionIds.includes(data.id))
    : []

  function resetAssignmentForm() {
    setAssignmentValues(INITIAL_ASSIGNMENT_FORM_VALUES)
    setAssignmentErrors({})
    assignAdmin.reset()
  }

  function handleOpenAssignmentForm() {
    assignAdmin.reset()
    setAssignmentErrors({})
    setIsAssignmentFormOpen(true)
  }

  function handleCancelAssignmentForm() {
    if (assignAdmin.isPending) {
      return
    }

    resetAssignmentForm()
    setIsAssignmentFormOpen(false)
  }

  function validateAssignmentForm() {
    const errors: AssignmentFormErrors = {}
    const selectedAdmin = expoAdmins.find((admin) => admin.id === Number(assignmentValues.adminId))

    if (!assignmentValues.adminId) {
      errors.adminId = '관리자를 선택해 주세요.'
    } else if (data && selectedAdmin?.assignedExhibitionIds.includes(data.id)) {
      errors.adminId = '이미 배정된 관리자입니다.'
    }

    setAssignmentErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmitAssignmentForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!data || !validateAssignmentForm()) {
      return
    }

    assignAdmin.mutate(
      {
        exhibitionId: data.id,
        userId: Number(assignmentValues.adminId),
      },
      {
        onSuccess: () => {
          resetAssignmentForm()
          setIsAssignmentFormOpen(false)
        },
      },
    )
  }

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
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-extrabold text-ink">관리자 배정</h2>
            <p className="mt-1 text-sm text-muted">이 행사를 운영할 EXPO_ADMIN을 배정합니다.</p>
          </div>
          <button
            type="button"
            onClick={handleOpenAssignmentForm}
            disabled={assignAdmin.isPending || adminsQuery.isLoading || adminsQuery.isError}
            className="bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
          >
            관리자 배정
          </button>
        </div>

        {isAssignmentFormOpen ? (
          <form onSubmit={handleSubmitAssignmentForm} className="mb-4 border border-line bg-surface p-5">
            <div className="mb-5">
              <h3 className="text-lg font-extrabold text-ink">관리자 배정</h3>
              <p className="mt-1 text-sm text-muted">
                기존 EXPO_ADMIN 중 이 행사를 담당할 관리자를 선택합니다.
              </p>
            </div>

            <div className="mb-5 border border-line bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">현재 행사</p>
              <div className="mt-2 text-sm font-semibold text-ink">{data.title}</div>
              <div className="mt-1 text-xs text-muted">{formatDateRange(data.startDate, data.endDate)}</div>
            </div>

            {assignAdmin.isError ? (
              <div className="mb-4 border border-danger/30 bg-danger/5 px-3 py-2 text-sm font-semibold text-danger">
                관리자 배정에 실패했습니다.
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="EXPO_ADMIN"
                id="platform-exhibition-admin-assignment"
                required
                error={assignmentErrors.adminId}
                hint={adminsQuery.isError ? '관리자 목록을 불러오지 못했습니다.' : undefined}
              >
                <select
                  id="platform-exhibition-admin-assignment"
                  value={assignmentValues.adminId}
                  onChange={(event) => {
                    setAssignmentValues((prev) => ({ ...prev, adminId: event.target.value }))
                    setAssignmentErrors((prev) => ({ ...prev, adminId: undefined }))
                  }}
                  disabled={assignAdmin.isPending || adminsQuery.isLoading || adminsQuery.isError}
                  className={[fieldControlClass, assignmentErrors.adminId ? fieldControlErrorClass : ''].join(' ')}
                >
                  <option value="">관리자 선택</option>
                  {expoAdmins.map((admin) => {
                    const isAssigned = admin.assignedExhibitionIds.includes(data.id)

                    return (
                      <option key={admin.id} value={admin.id} disabled={isAssigned}>
                        {admin.name} · {admin.email} · {admin.isActive ? '활성' : '비활성'}
                        {isAssigned ? ' · 이미 배정됨' : ''}
                      </option>
                    )
                  })}
                </select>
              </Field>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={assignAdmin.isPending}
                onClick={handleCancelAssignmentForm}
                className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={assignAdmin.isPending || adminsQuery.isLoading || adminsQuery.isError}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
              >
                {assignAdmin.isPending ? '배정 중...' : '배정'}
              </button>
            </div>
          </form>
        ) : null}

        <DataTable
          columns={adminColumns}
          data={assignedAdmins}
          rowKey={(row) => row.id}
          isLoading={adminsQuery.isLoading}
          isError={adminsQuery.isError}
          emptyMessage="배정된 관리자가 없습니다."
          pageSize={5}
        />
      </section>
    </section>
  )
}
