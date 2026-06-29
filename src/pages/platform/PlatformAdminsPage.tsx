import { useState, type FormEvent } from 'react'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { Field, fieldControlClass, fieldControlErrorClass } from '../../components/Field'
import type { PlatformAdminSummary } from '../../features/platform/api'
import { useCreatePlatformAdmin, usePlatformAdmins, usePlatformExhibitions } from '../../features/platform/hooks'

interface AdminFormValues {
  name: string
  email: string
  phone: string
  exhibitionId: string
}

type AdminFormErrors = Partial<Record<keyof Pick<AdminFormValues, 'name' | 'email' | 'exhibitionId'>, string>>

const INITIAL_FORM_VALUES: AdminFormValues = {
  name: '',
  email: '',
  phone: '',
  exhibitionId: '',
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function formatAssignedExhibitions(admin: PlatformAdminSummary, exhibitionTitles: Map<number, string>) {
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
  const createAdmin = useCreatePlatformAdmin()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formValues, setFormValues] = useState<AdminFormValues>(INITIAL_FORM_VALUES)
  const [formErrors, setFormErrors] = useState<AdminFormErrors>({})

  const admins = (adminsQuery.data ?? []).filter((admin) => admin.role === 'EXPO_ADMIN')
  const exhibitions = exhibitionsQuery.data ?? []
  const exhibitionTitles = new Map(
    exhibitions.map((exhibition) => [exhibition.id, exhibition.title]),
  )

  const assignedCount = admins.filter((admin) => admin.assignedExhibitionIds.length > 0).length
  const unassignedCount = admins.length - assignedCount

  function resetCreateForm() {
    setFormValues(INITIAL_FORM_VALUES)
    setFormErrors({})
    createAdmin.reset()
  }

  function handleOpenCreateForm() {
    resetCreateForm()
    setIsFormOpen(true)
  }

  function handleCancelCreateForm() {
    if (createAdmin.isPending) {
      return
    }

    resetCreateForm()
    setIsFormOpen(false)
  }

  function validateCreateForm() {
    const errors: AdminFormErrors = {}
    const name = formValues.name.trim()
    const email = formValues.email.trim()

    if (!name) {
      errors.name = '이름을 입력해 주세요.'
    }

    if (!email) {
      errors.email = '이메일을 입력해 주세요.'
    } else if (!isValidEmail(email)) {
      errors.email = '올바른 이메일 형식으로 입력해 주세요.'
    }

    if (!formValues.exhibitionId) {
      errors.exhibitionId = '담당 행사를 선택해 주세요.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmitCreateForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validateCreateForm()) {
      return
    }

    createAdmin.mutate(
      {
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        phone: formValues.phone.trim() || null,
        exhibitionId: Number(formValues.exhibitionId),
      },
      {
        onSuccess: () => {
          resetCreateForm()
          setIsFormOpen(false)
        },
      },
    )
  }

  const columns: DataTableColumn<PlatformAdminSummary>[] = [
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
            admin.isActive ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted',
          ].join(' ')}
        >
          {admin.isActive ? '활성' : '비활성'}
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
            onClick={handleOpenCreateForm}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            관리자 발급
          </button>
        </div>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmitCreateForm} className="border border-line bg-surface p-5">
          <div className="mb-5">
            <h2 className="text-lg font-extrabold text-ink">EXPO_ADMIN 발급</h2>
            <p className="mt-1 text-sm text-muted">
              행사 운영 관리자가 사용할 계정을 생성하고 담당 행사를 배정합니다.
            </p>
          </div>

          {createAdmin.isError && (
            <div className="mb-4 border border-danger/30 bg-danger/5 px-3 py-2 text-sm font-semibold text-danger">
              관리자 발급에 실패했습니다.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="이름" id="platform-admin-name" required error={formErrors.name}>
              <input
                id="platform-admin-name"
                value={formValues.name}
                onChange={(event) => {
                  setFormValues((prev) => ({ ...prev, name: event.target.value }))
                  setFormErrors((prev) => ({ ...prev, name: undefined }))
                }}
                disabled={createAdmin.isPending}
                className={[fieldControlClass, formErrors.name ? fieldControlErrorClass : ''].join(' ')}
              />
            </Field>

            <Field label="이메일" id="platform-admin-email" required error={formErrors.email}>
              <input
                id="platform-admin-email"
                type="email"
                value={formValues.email}
                onChange={(event) => {
                  setFormValues((prev) => ({ ...prev, email: event.target.value }))
                  setFormErrors((prev) => ({ ...prev, email: undefined }))
                }}
                disabled={createAdmin.isPending}
                className={[fieldControlClass, formErrors.email ? fieldControlErrorClass : ''].join(' ')}
              />
            </Field>

            <Field label="연락처" id="platform-admin-phone" hint="선택 입력">
              <input
                id="platform-admin-phone"
                value={formValues.phone}
                onChange={(event) => setFormValues((prev) => ({ ...prev, phone: event.target.value }))}
                disabled={createAdmin.isPending}
                className={fieldControlClass}
              />
            </Field>

            <Field
              label="담당 행사"
              id="platform-admin-exhibition"
              required
              error={formErrors.exhibitionId}
              hint={exhibitionsQuery.isError ? '행사 목록을 불러오지 못했습니다.' : undefined}
            >
              <select
                id="platform-admin-exhibition"
                value={formValues.exhibitionId}
                onChange={(event) => {
                  setFormValues((prev) => ({ ...prev, exhibitionId: event.target.value }))
                  setFormErrors((prev) => ({ ...prev, exhibitionId: undefined }))
                }}
                disabled={createAdmin.isPending || exhibitionsQuery.isLoading || exhibitionsQuery.isError}
                className={[fieldControlClass, formErrors.exhibitionId ? fieldControlErrorClass : ''].join(' ')}
              >
                <option value="">담당 행사 선택</option>
                {exhibitions.map((exhibition) => (
                  <option key={exhibition.id} value={exhibition.id}>
                    {exhibition.title} ({exhibition.status})
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              disabled={createAdmin.isPending}
              onClick={handleCancelCreateForm}
              className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={createAdmin.isPending || exhibitionsQuery.isLoading || exhibitionsQuery.isError}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
            >
              {createAdmin.isPending ? '발급 중...' : '발급'}
            </button>
          </div>
        </form>
      )}

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
