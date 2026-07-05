import { useState, type FormEvent } from 'react'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { Field, fieldControlClass, fieldControlErrorClass } from '../../components/Field'
import type { PlatformAdminSummary } from '../../features/platform/api'
import {
  useAssignPlatformAdmin,
  useInvitePlatformAdmin,
  usePlatformAdmins,
  usePlatformExhibitions,
  useResendPlatformInvite,
} from '../../features/platform/hooks'
import { AccountStatusBadge } from '../../components/AccountStatusBadge'

interface AdminFormValues {
  name: string
  email: string
}

type AdminFormErrors = Partial<Record<keyof AdminFormValues, string>>

interface AssignmentFormValues {
  exhibitionId: string
}

type AssignmentFormErrors = Partial<Record<keyof AssignmentFormValues, string>>

const INITIAL_FORM_VALUES: AdminFormValues = {
  name: '',
  email: '',
}

const INITIAL_ASSIGNMENT_FORM_VALUES: AssignmentFormValues = {
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
  const inviteAdmin = useInvitePlatformAdmin()
  const resendInvite = useResendPlatformInvite()
  const assignAdmin = useAssignPlatformAdmin()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formValues, setFormValues] = useState<AdminFormValues>(INITIAL_FORM_VALUES)
  const [formErrors, setFormErrors] = useState<AdminFormErrors>({})
  const [lastInvited, setLastInvited] = useState<{ name: string; email: string } | null>(null)
  const [lastResentId, setLastResentId] = useState<number | null>(null)
  const [selectedAdmin, setSelectedAdmin] = useState<PlatformAdminSummary | null>(null)
  const [assignmentValues, setAssignmentValues] = useState<AssignmentFormValues>(INITIAL_ASSIGNMENT_FORM_VALUES)
  const [assignmentErrors, setAssignmentErrors] = useState<AssignmentFormErrors>({})

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
    inviteAdmin.reset()
  }

  function handleOpenCreateForm() {
    resetCreateForm()
    resetAssignmentForm()
    setSelectedAdmin(null)
    setLastInvited(null)
    setIsFormOpen(true)
  }

  function handleCancelCreateForm() {
    if (inviteAdmin.isPending) {
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

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmitCreateForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validateCreateForm()) {
      return
    }

    const name = formValues.name.trim()
    const email = formValues.email.trim()

    inviteAdmin.mutate(
      { name, email },
      {
        onSuccess: () => {
          resetCreateForm()
          setIsFormOpen(false)
          setLastInvited({ name, email })
        },
      },
    )
  }

  function handleResendInvite(admin: PlatformAdminSummary) {
    setLastResentId(null)
    resendInvite.mutate(admin.id, {
      onSuccess: () => setLastResentId(admin.id),
    })
  }

  function resetAssignmentForm() {
    setAssignmentValues(INITIAL_ASSIGNMENT_FORM_VALUES)
    setAssignmentErrors({})
    assignAdmin.reset()
  }

  function handleOpenAssignmentForm(admin: PlatformAdminSummary) {
    if (assignAdmin.isPending) {
      return
    }

    resetCreateForm()
    setIsFormOpen(false)
    assignAdmin.reset()
    setSelectedAdmin(admin)
    setAssignmentValues(INITIAL_ASSIGNMENT_FORM_VALUES)
    setAssignmentErrors({})
  }

  function handleCancelAssignmentForm() {
    if (assignAdmin.isPending) {
      return
    }

    resetAssignmentForm()
    setSelectedAdmin(null)
  }

  function validateAssignmentForm() {
    const errors: AssignmentFormErrors = {}
    const exhibitionId = Number(assignmentValues.exhibitionId)

    if (!assignmentValues.exhibitionId) {
      errors.exhibitionId = '담당 행사를 선택해 주세요.'
    } else if (selectedAdmin?.assignedExhibitionIds.includes(exhibitionId)) {
      errors.exhibitionId = '이미 배정된 행사입니다.'
    }

    setAssignmentErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmitAssignmentForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedAdmin || !validateAssignmentForm()) {
      return
    }

    assignAdmin.mutate(
      {
        exhibitionId: Number(assignmentValues.exhibitionId),
        userId: selectedAdmin.id,
      },
      {
        onSuccess: () => {
          resetAssignmentForm()
          setSelectedAdmin(null)
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
      render: (admin) => <AccountStatusBadge status={admin.accountStatus} />,
    },
    {
      key: 'actions',
      header: '관리',
      render: (admin) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={assignAdmin.isPending}
            onClick={() => handleOpenAssignmentForm(admin)}
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:border-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
          >
            배정 관리
          </button>
          {admin.accountStatus === 'INVITED' && (
            <button
              type="button"
              disabled={resendInvite.isPending}
              onClick={() => handleResendInvite(admin)}
              title="초대 메일을 다시 보냅니다. 기존 링크는 사용할 수 없게 됩니다."
              className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
            >
              {lastResentId === admin.id ? '재발송 완료' : '초대 재발송'}
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">EXPO_ADMIN 관리</h1>
          <p className="mt-2 text-sm text-muted">
            박람회 운영 관리자를 이메일로 초대하고 행사에 배정합니다.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <button
            type="button"
            onClick={handleOpenCreateForm}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            관리자 초대
          </button>
        </div>
      </div>

      {lastInvited && (
        <div className="border border-success/30 bg-success/5 px-3 py-2 text-sm font-semibold text-success">
          {lastInvited.name}님({lastInvited.email})에게 초대 메일을 보냈습니다. 링크에서 비밀번호를 설정하면 계정이
          활성화됩니다.
        </div>
      )}

      {isFormOpen && (
        <form onSubmit={handleSubmitCreateForm} className="border border-line bg-surface p-5">
          <div className="mb-5">
            <h2 className="text-lg font-extrabold text-ink">EXPO_ADMIN 초대</h2>
            <p className="mt-1 text-sm text-muted">
              초대 메일의 링크로 본인이 직접 비밀번호를 설정하면 계정이 활성화됩니다. 담당 행사는 초대 후 목록의
              "배정 관리"에서 배정합니다.
            </p>
          </div>

          {inviteAdmin.isError && (
            <div className="mb-4 border border-danger/30 bg-danger/5 px-3 py-2 text-sm font-semibold text-danger">
              {inviteAdmin.error instanceof Error ? inviteAdmin.error.message : '관리자 초대에 실패했습니다.'}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="이름" id="platform-admin-name" required error={formErrors.name}>
              <input
                id="platform-admin-name"
                value={formValues.name}
                onChange={(event) => {
                  setFormValues((prev) => ({ ...prev, name: event.target.value }))
                  setFormErrors((prev) => ({ ...prev, name: undefined }))
                }}
                disabled={inviteAdmin.isPending}
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
                disabled={inviteAdmin.isPending}
                className={[fieldControlClass, formErrors.email ? fieldControlErrorClass : ''].join(' ')}
              />
            </Field>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              disabled={inviteAdmin.isPending}
              onClick={handleCancelCreateForm}
              className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={inviteAdmin.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
            >
              {inviteAdmin.isPending ? '발송 중...' : '초대 메일 발송'}
            </button>
          </div>
        </form>
      )}

      {selectedAdmin && (
        <form onSubmit={handleSubmitAssignmentForm} className="border border-line bg-surface p-5">
          <div className="mb-5">
            <h2 className="text-lg font-extrabold text-ink">담당 행사 배정</h2>
            <p className="mt-1 text-sm text-muted">선택한 EXPO_ADMIN이 운영할 행사를 배정합니다.</p>
          </div>

          <div className="mb-5 border border-line bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">대상 관리자</p>
            <div className="mt-2 text-sm font-semibold text-ink">{selectedAdmin.name}</div>
            <div className="mt-1 text-xs text-muted">{selectedAdmin.email}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedAdmin.assignedExhibitionIds.length > 0 ? (
                selectedAdmin.assignedExhibitionIds.map((id) => (
                  <span key={id} className="border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-ink">
                    {exhibitionTitles.get(id) ?? `#${id}`}
                  </span>
                ))
              ) : (
                <span className="text-xs font-semibold text-muted">미배정</span>
              )}
            </div>
          </div>

          {assignAdmin.isError && (
            <div className="mb-4 border border-danger/30 bg-danger/5 px-3 py-2 text-sm font-semibold text-danger">
              관리자 배정에 실패했습니다.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="담당 행사"
              id="platform-admin-assignment-exhibition"
              required
              error={assignmentErrors.exhibitionId}
              hint={exhibitionsQuery.isError ? '행사 목록을 불러오지 못했습니다.' : undefined}
            >
              <select
                id="platform-admin-assignment-exhibition"
                value={assignmentValues.exhibitionId}
                onChange={(event) => {
                  setAssignmentValues((prev) => ({ ...prev, exhibitionId: event.target.value }))
                  setAssignmentErrors((prev) => ({ ...prev, exhibitionId: undefined }))
                }}
                disabled={assignAdmin.isPending || exhibitionsQuery.isLoading || exhibitionsQuery.isError}
                className={[fieldControlClass, assignmentErrors.exhibitionId ? fieldControlErrorClass : ''].join(' ')}
              >
                <option value="">담당 행사 선택</option>
                {exhibitions.map((exhibition) => {
                  const isAssigned = selectedAdmin.assignedExhibitionIds.includes(exhibition.id)

                  return (
                    <option key={exhibition.id} value={exhibition.id} disabled={isAssigned}>
                      {exhibition.title} ({exhibition.status}){isAssigned ? ' · 이미 배정됨' : ''}
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
              disabled={assignAdmin.isPending || exhibitionsQuery.isLoading || exhibitionsQuery.isError}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
            >
              {assignAdmin.isPending ? '배정 중...' : '배정'}
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
