import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { Field, fieldControlClass, fieldControlErrorClass } from '../../components/Field'
import {
  useCreatePlatformExhibition,
  useDeletePlatformExhibition,
  usePlatformExhibitions,
  useUpdatePlatformExhibitionStatus,
} from '../../features/platform/hooks'
import type { PlatformExhibitionSummary } from '../../features/platform/api'
import { formatDateRange } from '../../lib/format'
import type { ExhibitionStatus } from '../../types'

const STATUS_BADGE: Record<ExhibitionStatus, { label: string; className: string }> = {
  DRAFT: { label: 'DRAFT', className: 'bg-warning text-white' },
  OPEN: { label: 'OPEN', className: 'bg-live text-ink' },
  CLOSED: { label: 'CLOSED', className: 'bg-line text-muted' },
}

const EXHIBITION_STATUS_OPTIONS: ExhibitionStatus[] = ['DRAFT', 'OPEN', 'CLOSED']

type PendingAction =
  | { type: 'close'; id: number; targetStatus: ExhibitionStatus }
  | { type: 'delete'; id: number }

interface ExhibitionFormValues {
  title: string
  slug: string
  venue: string
  address: string
  startDate: string
  endDate: string
}

type ExhibitionFormErrors = Partial<Record<keyof ExhibitionFormValues, string>>

const INITIAL_EXHIBITION_FORM_VALUES: ExhibitionFormValues = {
  title: '',
  slug: '',
  venue: '',
  address: '',
  startDate: '',
  endDate: '',
}

const isValidSlug = (slug: string) => /^[a-z0-9-]+$/.test(slug)

function StatusBadge({ status }: { status: ExhibitionStatus }) {
  const badge = STATUS_BADGE[status]
  return <span className={`inline-flex px-2.5 py-1 text-xs font-bold ${badge.className}`}>{badge.label}</span>
}

export default function PlatformExhibitionsPage() {
  const exhibitions = usePlatformExhibitions()
  const createExhibition = useCreatePlatformExhibition()
  const updateStatus = useUpdatePlatformExhibitionStatus()
  const deleteExhibition = useDeletePlatformExhibition()
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formValues, setFormValues] = useState<ExhibitionFormValues>(INITIAL_EXHIBITION_FORM_VALUES)
  const [formErrors, setFormErrors] = useState<ExhibitionFormErrors>({})
  const data = exhibitions.data ?? []

  function resetCreateForm() {
    setFormValues(INITIAL_EXHIBITION_FORM_VALUES)
    setFormErrors({})
    createExhibition.reset()
  }

  function handleOpenCreateForm() {
    createExhibition.reset()
    setFormErrors({})
    setIsFormOpen(true)
  }

  function handleCancelCreateForm() {
    if (createExhibition.isPending) {
      return
    }

    resetCreateForm()
    setIsFormOpen(false)
  }

  function validateCreateForm() {
    const nextErrors: ExhibitionFormErrors = {}
    const title = formValues.title.trim()
    const slug = formValues.slug.trim()
    const venue = formValues.venue.trim()

    if (!title) {
      nextErrors.title = '행사명을 입력해 주세요.'
    }

    if (!slug) {
      nextErrors.slug = 'slug를 입력해 주세요.'
    } else if (!isValidSlug(slug)) {
      nextErrors.slug = 'slug는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.'
    }

    if (!venue) {
      nextErrors.venue = '장소명을 입력해 주세요.'
    }

    if (!formValues.startDate) {
      nextErrors.startDate = '시작일을 선택해 주세요.'
    }

    if (!formValues.endDate) {
      nextErrors.endDate = '종료일을 선택해 주세요.'
    } else if (formValues.startDate && formValues.endDate < formValues.startDate) {
      nextErrors.endDate = '종료일은 시작일 이후여야 합니다.'
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmitCreateForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validateCreateForm()) {
      return
    }

    createExhibition.mutate(
      {
        title: formValues.title.trim(),
        slug: formValues.slug.trim(),
        venue: formValues.venue.trim(),
        address: formValues.address.trim(),
        startDate: formValues.startDate,
        endDate: formValues.endDate,
        status: 'DRAFT',
      },
      {
        onSuccess: () => {
          resetCreateForm()
          setIsFormOpen(false)
        },
      },
    )
  }

  function handleStatusChange(id: number, status: ExhibitionStatus) {
    if (status === 'CLOSED') {
      setPendingAction({ type: 'close', id, targetStatus: status })
      return
    }

    updateStatus.mutate({ id, status })
  }

  function handleDeleteExhibition(id: number) {
    setPendingAction({ type: 'delete', id })
  }

  function handleConfirmAction() {
    if (!pendingAction) {
      return
    }

    if (pendingAction.type === 'close') {
      updateStatus.mutate(
        { id: pendingAction.id, status: pendingAction.targetStatus },
        { onSuccess: () => setPendingAction(null) },
      )
      return
    }

    deleteExhibition.mutate(pendingAction.id, { onSuccess: () => setPendingAction(null) })
  }

  const confirmDialog =
    pendingAction?.type === 'delete'
      ? {
          title: '행사를 삭제하시겠습니까?',
          description: '정말 이 행사를 삭제하시겠습니까?\n삭제 후 목록과 통계에서 제외됩니다.',
          confirmLabel: '삭제',
          variant: 'destructive' as const,
        }
      : {
          title: '행사를 종료 상태로 변경하시겠습니까?',
          description: '이 행사를 종료 상태로 변경하시겠습니까?',
          confirmLabel: '종료 상태로 변경',
          variant: 'destructive' as const,
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
        <div className="flex min-w-[300px] flex-wrap justify-end gap-2">
          <Link
            to={`/platform/exhibitions/${row.id}`}
            className="px-2.5 py-1.5 text-xs font-bold text-primary ring-1 ring-line transition-colors hover:text-primary-hover hover:ring-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            상세 보기
          </Link>
          <div className="flex items-center gap-1" aria-label="상태 변경">
            {EXHIBITION_STATUS_OPTIONS.map((status) => {
              const isCurrent = status === row.status
              const isPending =
                updateStatus.isPending &&
                updateStatus.variables?.id === row.id &&
                updateStatus.variables?.status === status

              return (
                <button
                  key={status}
                  type="button"
                  disabled={isCurrent || updateStatus.isPending || deleteExhibition.isPending}
                  onClick={() => handleStatusChange(row.id, status)}
                  className={[
                    'px-2 py-1.5 text-xs font-bold ring-1 ring-line transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55',
                    isCurrent ? 'bg-surface text-muted' : 'text-primary hover:text-primary-hover hover:ring-primary',
                    isPending ? 'opacity-55' : '',
                  ].join(' ')}
                  title={isCurrent ? '현재 상태입니다.' : `${status} 상태로 변경`}
                >
                  {status}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            disabled={updateStatus.isPending || deleteExhibition.isPending}
            onClick={() => handleDeleteExhibition(row.id)}
            className="px-2.5 py-1.5 text-xs font-bold text-danger ring-1 ring-line transition-colors hover:ring-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:cursor-not-allowed disabled:opacity-55"
          >
            삭제
          </button>
        </div>
      ),
    },
  ]

  return (
    <section className="space-y-5">
      <ConfirmDialog
        open={pendingAction !== null}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel="취소"
        variant={confirmDialog.variant}
        isPending={updateStatus.isPending || deleteExhibition.isPending}
        onConfirm={handleConfirmAction}
        onCancel={() => setPendingAction(null)}
      />

      <div className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-primary">PLATFORM_ADMIN</div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">전체 행사 관리</h1>
          <p className="mt-2 text-sm text-muted">플랫폼 전체 박람회를 생성하고 상태를 관리합니다.</p>
        </div>

        <div className="flex flex-col items-start gap-2 lg:items-end">
          <button
            type="button"
            onClick={handleOpenCreateForm}
            disabled={createExhibition.isPending}
            className="bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
          >
            행사 생성
          </button>
        </div>
      </div>

      {isFormOpen ? (
        <form onSubmit={handleSubmitCreateForm} className="space-y-4 border border-line bg-white p-5">
          <div>
            <h2 className="text-base font-bold text-ink">행사 생성</h2>
            <p className="mt-1 text-sm text-muted">플랫폼에서 운영할 신규 행사의 기본 정보를 등록합니다.</p>
          </div>

          {createExhibition.isError ? (
            <div className="border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-bold text-danger">
              행사 생성에 실패했습니다.
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field id="exhibition-title" label="행사명" error={formErrors.title} required>
              <input
                id="exhibition-title"
                value={formValues.title}
                onChange={(event) => setFormValues((prev) => ({ ...prev, title: event.target.value }))}
                className={`${fieldControlClass} ${formErrors.title ? fieldControlErrorClass : ''}`}
                placeholder="예: 2026 푸드페어"
                disabled={createExhibition.isPending}
              />
            </Field>

            <Field id="exhibition-slug" label="slug" error={formErrors.slug} hint="영문 소문자, 숫자, 하이픈만 사용" required>
              <input
                id="exhibition-slug"
                value={formValues.slug}
                onChange={(event) => setFormValues((prev) => ({ ...prev, slug: event.target.value }))}
                className={`${fieldControlClass} ${formErrors.slug ? fieldControlErrorClass : ''}`}
                placeholder="food-fair-2026"
                disabled={createExhibition.isPending}
              />
            </Field>

            <Field id="exhibition-venue" label="장소명" error={formErrors.venue} required>
              <input
                id="exhibition-venue"
                value={formValues.venue}
                onChange={(event) => setFormValues((prev) => ({ ...prev, venue: event.target.value }))}
                className={`${fieldControlClass} ${formErrors.venue ? fieldControlErrorClass : ''}`}
                placeholder="예: 코엑스 A홀"
                disabled={createExhibition.isPending}
              />
            </Field>

            <Field id="exhibition-address" label="주소" error={formErrors.address} hint="선택 입력">
              <input
                id="exhibition-address"
                value={formValues.address}
                onChange={(event) => setFormValues((prev) => ({ ...prev, address: event.target.value }))}
                className={`${fieldControlClass} ${formErrors.address ? fieldControlErrorClass : ''}`}
                placeholder="예: 서울 강남구 영동대로 513"
                disabled={createExhibition.isPending}
              />
            </Field>

            <Field id="exhibition-start-date" label="시작일" error={formErrors.startDate} required>
              <input
                id="exhibition-start-date"
                type="date"
                value={formValues.startDate}
                onChange={(event) => setFormValues((prev) => ({ ...prev, startDate: event.target.value }))}
                className={`${fieldControlClass} ${formErrors.startDate ? fieldControlErrorClass : ''}`}
                disabled={createExhibition.isPending}
              />
            </Field>

            <Field id="exhibition-end-date" label="종료일" error={formErrors.endDate} required>
              <input
                id="exhibition-end-date"
                type="date"
                value={formValues.endDate}
                onChange={(event) => setFormValues((prev) => ({ ...prev, endDate: event.target.value }))}
                className={`${fieldControlClass} ${formErrors.endDate ? fieldControlErrorClass : ''}`}
                disabled={createExhibition.isPending}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancelCreateForm}
              disabled={createExhibition.isPending}
              className="border border-line bg-white px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={createExhibition.isPending}
              className="bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
            >
              {createExhibition.isPending ? '생성 중...' : '생성'}
            </button>
          </div>
        </form>
      ) : null}

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
              <div className="text-xs font-semibold text-muted">상태 변경과 삭제는 확인 후 처리됩니다.</div>
            </div>
          }
        />
      )}
    </section>
  )
}
