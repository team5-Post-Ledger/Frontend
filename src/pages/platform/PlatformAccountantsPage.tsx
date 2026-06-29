import { useState, type FormEvent } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { Field, fieldControlClass, fieldControlErrorClass } from '../../components/Field'
import type { PlatformAccountantSummary } from '../../features/platform/api'
import {
  useActivatePlatformAccountant,
  useCreatePlatformAccountant,
  useDeactivatePlatformAccountant,
  usePlatformAccountants,
} from '../../features/platform/hooks'

type PendingAction =
  | { type: 'deactivate'; accountant: PlatformAccountantSummary }
  | { type: 'activate'; accountant: PlatformAccountantSummary }

interface AccountantFormValues {
  name: string
  email: string
  phone: string
}

type AccountantFormErrors = Partial<Record<keyof Pick<AccountantFormValues, 'name' | 'email'>, string>>

const INITIAL_FORM_VALUES: AccountantFormValues = {
  name: '',
  email: '',
  phone: '',
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function PlatformAccountantsPage() {
  const accountantsQuery = usePlatformAccountants()
  const createAccountant = useCreatePlatformAccountant()
  const deactivateAccountant = useDeactivatePlatformAccountant()
  const activateAccountant = useActivatePlatformAccountant()
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formValues, setFormValues] = useState<AccountantFormValues>(INITIAL_FORM_VALUES)
  const [formErrors, setFormErrors] = useState<AccountantFormErrors>({})

  const accountants = (accountantsQuery.data ?? []).filter(
    (accountant) => accountant.role === 'ACCOUNTANT',
  )
  const activeCount = accountants.filter((accountant) => accountant.isActive).length
  const inactiveCount = accountants.length - activeCount
  const isMutating = deactivateAccountant.isPending || activateAccountant.isPending

  function resetCreateForm() {
    setFormValues(INITIAL_FORM_VALUES)
    setFormErrors({})
    createAccountant.reset()
  }

  function handleOpenCreateForm() {
    resetCreateForm()
    setIsFormOpen(true)
  }

  function handleCancelCreateForm() {
    if (createAccountant.isPending) {
      return
    }

    resetCreateForm()
    setIsFormOpen(false)
  }

  function validateCreateForm() {
    const errors: AccountantFormErrors = {}
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

    createAccountant.mutate(
      {
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        phone: formValues.phone.trim() || null,
      },
      {
        onSuccess: () => {
          resetCreateForm()
          setIsFormOpen(false)
        },
      },
    )
  }

  function handleToggleAccountant(accountant: PlatformAccountantSummary) {
    if (accountant.isActive) {
      setPendingAction({ type: 'deactivate', accountant })
      return
    }

    setPendingAction({ type: 'activate', accountant })
  }

  function handleConfirmAction() {
    if (!pendingAction) {
      return
    }

    if (pendingAction.type === 'deactivate') {
      deactivateAccountant.mutate(pendingAction.accountant.id, { onSuccess: () => setPendingAction(null) })
      return
    }

    activateAccountant.mutate(pendingAction.accountant.id, { onSuccess: () => setPendingAction(null) })
  }

  const confirmDialog =
    pendingAction?.type === 'activate'
      ? {
          title: '회계 계정을 활성화하시겠습니까?',
          description: '이 회계 계정을 다시 활성화하시겠습니까?',
          confirmLabel: '활성화',
          variant: 'default' as const,
        }
      : {
          title: '회계 계정을 비활성화하시겠습니까?',
          description: '이 회계 계정을 비활성화하시겠습니까?',
          confirmLabel: '비활성화',
          variant: 'destructive' as const,
        }

  const columns: DataTableColumn<PlatformAccountantSummary>[] = [
    {
      key: 'name',
      header: '이름',
      render: (accountant) => (
        <span className="font-medium text-foreground">{accountant.name}</span>
      ),
    },
    {
      key: 'email',
      header: '이메일',
      render: (accountant) => accountant.email,
    },
    {
      key: 'phone',
      header: '전화번호',
      render: (accountant) => accountant.phone ?? '-',
    },
    {
      key: 'scope',
      header: '접근 범위',
      render: () => '전체 정산 리포트',
    },
    {
      key: 'active',
      header: '상태',
      render: (accountant) => (
        <span
          className={[
            'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
            accountant.isActive ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted',
          ].join(' ')}
        >
          {accountant.isActive ? '활성' : '비활성'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '관리',
      render: (accountant) => (
        <button
          type="button"
          disabled={isMutating}
          onClick={() => handleToggleAccountant(accountant)}
          className={[
            'rounded-md border border-line px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:text-muted disabled:opacity-55',
            accountant.isActive
              ? 'text-danger hover:border-danger hover:bg-danger/5 focus-visible:outline-danger'
              : 'text-primary hover:border-primary hover:bg-surface focus-visible:outline-primary',
          ].join(' ')}
          title={accountant.isActive ? 'ACCOUNTANT 계정을 비활성 처리합니다.' : 'ACCOUNTANT 계정을 다시 활성화합니다.'}
        >
          {accountant.isActive ? '비활성화' : '활성화'}
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={pendingAction !== null}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel="취소"
        variant={confirmDialog.variant}
        isPending={isMutating}
        onConfirm={handleConfirmAction}
        onCancel={() => setPendingAction(null)}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">ACCOUNTANT 관리</h1>
          <p className="mt-2 text-sm text-muted">
            정산 담당 계정을 발급하고 비활성 상태를 관리합니다.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <button
            type="button"
            onClick={handleOpenCreateForm}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            회계 계정 발급
          </button>
        </div>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmitCreateForm} className="border border-line bg-surface p-5">
          <div className="mb-5">
            <h2 className="text-lg font-extrabold text-ink">ACCOUNTANT 발급</h2>
            <p className="mt-1 text-sm text-muted">정산 담당자가 사용할 계정을 생성합니다.</p>
          </div>

          {createAccountant.isError && (
            <div className="mb-4 border border-danger/30 bg-danger/5 px-3 py-2 text-sm font-semibold text-danger">
              계정 발급에 실패했습니다.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="이름" id="accountant-name" required error={formErrors.name}>
              <input
                id="accountant-name"
                value={formValues.name}
                onChange={(event) => {
                  setFormValues((prev) => ({ ...prev, name: event.target.value }))
                  setFormErrors((prev) => ({ ...prev, name: undefined }))
                }}
                disabled={createAccountant.isPending}
                className={[fieldControlClass, formErrors.name ? fieldControlErrorClass : ''].join(' ')}
              />
            </Field>

            <Field label="이메일" id="accountant-email" required error={formErrors.email}>
              <input
                id="accountant-email"
                type="email"
                value={formValues.email}
                onChange={(event) => {
                  setFormValues((prev) => ({ ...prev, email: event.target.value }))
                  setFormErrors((prev) => ({ ...prev, email: undefined }))
                }}
                disabled={createAccountant.isPending}
                className={[fieldControlClass, formErrors.email ? fieldControlErrorClass : ''].join(' ')}
              />
            </Field>

            <Field label="연락처" id="accountant-phone" hint="선택 입력">
              <input
                id="accountant-phone"
                value={formValues.phone}
                onChange={(event) => setFormValues((prev) => ({ ...prev, phone: event.target.value }))}
                disabled={createAccountant.isPending}
                className={fieldControlClass}
              />
            </Field>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              disabled={createAccountant.isPending}
              onClick={handleCancelCreateForm}
              className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={createAccountant.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
            >
              {createAccountant.isPending ? '발급 중...' : '발급'}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <section className="rounded-lg border border-line bg-surface p-4">
          <p className="text-sm text-muted">전체 ACCOUNTANT 수</p>
          <strong className="mt-2 block text-2xl font-semibold text-foreground">
            {accountants.length}
          </strong>
        </section>
        <section className="rounded-lg border border-line bg-surface p-4">
          <p className="text-sm text-muted">활성 계정 수</p>
          <strong className="mt-2 block text-2xl font-semibold text-foreground">
            {activeCount}
          </strong>
        </section>
        <section className="rounded-lg border border-line bg-surface p-4">
          <p className="text-sm text-muted">비활성 계정 수</p>
          <strong className="mt-2 block text-2xl font-semibold text-foreground">
            {inactiveCount}
          </strong>
        </section>
      </div>

      <div className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">
        ACCOUNTANT는 행사별 매출, 수수료, 광고수익, 정산 리포트 조회와 다운로드를
        담당하는 전체 정산 접근 역할입니다.
      </div>

      {accountantsQuery.isError ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-5 text-sm text-danger">
          회계 계정 목록을 불러오지 못했습니다.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={accountants}
          rowKey={(accountant) => accountant.id}
          isLoading={accountantsQuery.isLoading}
          emptyMessage="등록된 ACCOUNTANT 계정이 없습니다."
          pageSize={10}
        />
      )}
    </div>
  )
}
