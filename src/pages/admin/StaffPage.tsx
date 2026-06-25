import type { FormEvent } from 'react'
import { useState } from 'react'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { Field, fieldControlClass } from '../../components/Field'
import { useCurrentExhibition } from '../../features/exhibition/hooks'
import { useAssignStaff, useStaffAssignments, useUnassignStaff } from '../../features/staff/hooks'
import type { StaffAssignInput, StaffAssignmentView } from '../../lib/api/staff'
import { formatDateTime } from '../../lib/format'

type EditingTarget = 'new' | number | null

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function QualifiedBadge({ qualified, enforceGate }: { qualified: boolean; enforceGate: boolean }) {
  if (qualified) {
    return <span className="px-2.5 py-1 text-[11px] font-bold bg-success text-white">수료</span>
  }

  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-flex w-fit px-2.5 py-1 text-[11px] font-bold ${enforceGate ? 'bg-danger text-white' : 'bg-warning text-white'}`}>
        미수료
      </span>
      {enforceGate && <span className="text-[10.5px] font-semibold text-danger">하드 게이트 · 체크인 불가</span>}
    </div>
  )
}

function StaffEditorPanel({
  assignment,
  exhibitionId,
  enforceGate,
  onClose,
}: {
  assignment: StaffAssignmentView | null
  exhibitionId: number
  enforceGate: boolean
  onClose: () => void
}) {
  const isNew = assignment === null
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Partial<Record<'name' | 'email', string>>>({})

  const assignMutation = useAssignStaff()
  const unassignMutation = useUnassignStaff()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: typeof errors = {}
    if (!name.trim()) nextErrors.name = '이름을 입력해주세요.'
    if (!email.trim()) nextErrors.email = '이메일을 입력해주세요.'
    else if (!EMAIL_PATTERN.test(email.trim())) nextErrors.email = '올바른 이메일 형식이 아닙니다.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const input: StaffAssignInput = { name: name.trim(), email: email.trim() }
    assignMutation.mutate({ exhibitionId, input }, { onSuccess: onClose })
  }

  function handleUnassign() {
    if (!assignment) return
    unassignMutation.mutate({ exhibitionId, assignmentId: assignment.id }, { onSuccess: onClose })
  }

  return (
    <div className="w-full shrink-0 border border-line bg-white lg:sticky lg:top-6 lg:w-[380px]">
      <div className="flex items-start justify-between gap-3 border-b border-line p-5">
        <div>
          <div className="text-lg font-extrabold tracking-tight text-ink">{isNew ? 'STAFF 발급·배정' : assignment.name}</div>
          <div className="mt-0.5 text-xs text-muted">
            {isNew ? '이메일이 기존 계정과 같으면 그 계정을 이 행사에 배정합니다.' : assignment.email}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="flex h-7 w-7 shrink-0 items-center justify-center border border-line text-muted transition-colors hover:border-primary hover:text-primary"
        >
          <CloseIcon />
        </button>
      </div>

      {isNew ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5">
          <Field label="이름" id="staff-name" required error={errors.name}>
            <input id="staff-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="예: 김현장" className={fieldControlClass} />
          </Field>
          <Field
            label="이메일"
            id="staff-email"
            required
            error={errors.email}
            hint="기존 계정 이메일이면 그 계정을 STAFF로 배정하고, 아니면 새 계정을 발급합니다."
          >
            <input
              id="staff-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="staff@example.com"
              className={fieldControlClass}
            />
          </Field>

          {assignMutation.isError && <p className="text-xs font-medium text-danger">배정 중 오류가 발생했습니다. 다시 시도해주세요.</p>}

          <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
            <button
              type="submit"
              disabled={assignMutation.isPending}
              className="flex h-11 items-center justify-center gap-2 bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-default disabled:bg-muted"
            >
              {assignMutation.isPending && <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />}
              발급·배정
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-5 p-5">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
            <dt className="text-muted">배정일</dt>
            <dd className="text-ink">{formatDateTime(assignment.assignedAt)}</dd>
            <dt className="text-muted">자격(qualified)</dt>
            <dd>
              <QualifiedBadge qualified={assignment.qualified} enforceGate={enforceGate} />
            </dd>
          </dl>

          {!assignment.qualified && (
            <p className="text-xs text-muted">
              {enforceGate
                ? '필수 LMS를 수료하지 않아 체크인·현장결제·워크인 엔드포인트를 실행할 수 없습니다.'
                : '필수 LMS를 수료하지 않았습니다. 이 행사는 소프트 게이트라 체크인은 가능하지만 경고가 표시됩니다.'}
            </p>
          )}

          <div className="border-t border-line pt-4">
            <button
              type="button"
              onClick={handleUnassign}
              disabled={unassignMutation.isPending}
              className="flex h-11 w-full items-center justify-center gap-2 border border-danger text-sm font-bold text-danger transition-colors hover:bg-danger/10 disabled:cursor-default disabled:opacity-50"
            >
              {unassignMutation.isPending && <span className="h-4 w-4 rounded-full border-2 border-danger/30 border-t-danger motion-safe:animate-spin" />}
              배정 해제
            </button>
            {unassignMutation.isError && <p className="mt-2 text-xs font-medium text-danger">해제 중 오류가 발생했습니다. 다시 시도해주세요.</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export default function StaffPage() {
  const exhibition = useCurrentExhibition()
  const exhibitionId = exhibition.data?.id ?? null
  const enforceGate = exhibition.data?.enforceStaffQualification ?? false

  const assignments = useStaffAssignments(exhibitionId)
  const [editingTarget, setEditingTarget] = useState<EditingTarget>(null)

  const data = assignments.data ?? []
  const editingAssignment = typeof editingTarget === 'number' ? data.find((item) => item.id === editingTarget) ?? null : null

  const columns: DataTableColumn<StaffAssignmentView>[] = [
    { key: 'name', header: '이름', sortable: true },
    { key: 'email', header: '이메일', sortable: true },
    {
      key: 'assignedAt',
      header: '배정일',
      sortable: true,
      sortValue: (row) => new Date(row.assignedAt).getTime(),
      render: (row) => formatDateTime(row.assignedAt),
    },
    {
      key: 'qualified',
      header: '자격(qualified)',
      render: (row) => <QualifiedBadge qualified={row.qualified} enforceGate={enforceGate} />,
    },
  ]

  if (exhibition.isError) {
    return <p className="text-sm text-danger">행사 정보를 불러오지 못했습니다.</p>
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">스태프 관리</h1>
          <p className="mt-1 text-sm text-muted">
            이 행사에 배정된 STAFF 총 <b className="text-ink">{data.length.toLocaleString()}</b>명
            {enforceGate && <span className="ml-1.5 font-semibold text-danger">· 하드 게이트 적용 중(미수료 STAFF는 체크인 불가)</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditingTarget('new')}
          className="flex items-center gap-2 bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
        >
          <PlusIcon />
          STAFF 발급·배정
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <DataTable
            columns={columns}
            data={data}
            rowKey={(row) => row.id}
            isLoading={exhibition.isLoading || assignments.isLoading}
            isError={assignments.isError}
            emptyMessage="배정된 STAFF가 없습니다. STAFF를 발급·배정해보세요."
            pageSize={8}
            onRowClick={(row) => setEditingTarget(row.id)}
          />
        </div>

        {editingTarget !== null && exhibitionId !== null && (
          <StaffEditorPanel
            key={typeof editingTarget === 'number' ? editingTarget : 'new'}
            assignment={editingAssignment}
            exhibitionId={exhibitionId}
            enforceGate={enforceGate}
            onClose={() => setEditingTarget(null)}
          />
        )}
      </div>
    </div>
  )
}
