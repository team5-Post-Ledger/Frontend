import type { FormEvent } from 'react'
import { useState } from 'react'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { Field, fieldControlClass } from '../../components/Field'
import { useCurrentExhibition } from '../../features/exhibition/hooks'
import { useCreateTicketType, useDeleteTicketType, useTicketTypes, useUpdateTicketType } from '../../features/ticketType/hooks'
import { getRemainingQuota, type TicketTypeInput } from '../../lib/api/ticketTypes'
import { formatCurrency } from '../../lib/format'
import type { TicketType } from '../../types'

type EditingTarget = 'new' | number | null

interface TicketTypeFormState {
  name: string
  price: string
  quota: string
}

type TicketTypeFormErrors = Partial<Record<keyof TicketTypeFormState, string>>

function ticketTypeToFormState(ticketType: TicketType | null): TicketTypeFormState {
  if (!ticketType) return { name: '', price: '', quota: '' }
  return { name: ticketType.name, price: String(ticketType.price), quota: String(ticketType.quota) }
}

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

function getQuotaBadge(remaining: number, quota: number): { label: string; className: string } | null {
  if (remaining <= 0) return { label: '품절', className: 'bg-danger text-white' }
  if (quota > 0 && remaining / quota <= 0.15) return { label: '품절임박', className: 'bg-warning text-white' }
  return null
}

function TicketTypeEditorPanel({
  ticketType,
  exhibitionId,
  onClose,
}: {
  ticketType: TicketType | null
  exhibitionId: number
  onClose: () => void
}) {
  const isNew = ticketType === null
  const [form, setForm] = useState<TicketTypeFormState>(() => ticketTypeToFormState(ticketType))
  const [errors, setErrors] = useState<TicketTypeFormErrors>({})

  const createMutation = useCreateTicketType()
  const updateMutation = useUpdateTicketType()
  const deleteMutation = useDeleteTicketType()

  const isSaving = createMutation.isPending || updateMutation.isPending

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: TicketTypeFormErrors = {}
    if (!form.name.trim()) nextErrors.name = '티켓 이름을 입력해주세요.'
    if (form.price.trim() === '' || Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
      nextErrors.price = '0 이상의 숫자를 입력해주세요.'
    }
    if (form.quota.trim() === '' || Number.isNaN(Number(form.quota)) || Number(form.quota) < 1) {
      nextErrors.quota = '1 이상의 숫자를 입력해주세요.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const input: TicketTypeInput = {
      name: form.name.trim(),
      price: Number(form.price),
      quota: Number(form.quota),
    }

    if (isNew) {
      createMutation.mutate({ exhibitionId, input }, { onSuccess: onClose })
    } else if (ticketType) {
      updateMutation.mutate({ id: ticketType.id, input }, { onSuccess: onClose })
    }
  }

  function handleDelete() {
    if (!ticketType) return
    deleteMutation.mutate(ticketType.id, { onSuccess: onClose })
  }

  return (
    <div className="w-full shrink-0 border border-line bg-white lg:sticky lg:top-6 lg:w-[380px]">
      <div className="flex items-start justify-between gap-3 border-b border-line p-5">
        <div>
          <div className="text-lg font-extrabold tracking-tight text-ink">{isNew ? '새 티켓' : ticketType.name}</div>
          <div className="mt-0.5 text-xs text-muted">
            {isNew ? '신규 티켓 타입을 등록합니다.' : `정원 ${ticketType.quota.toLocaleString()}매`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="shrink-0 border border-line px-2.5 py-1 text-[11px] font-bold text-muted">{isNew ? '신규' : '편집'}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-7 w-7 shrink-0 items-center justify-center border border-line text-muted transition-colors hover:border-primary hover:text-primary"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5">
        <Field label="티켓 이름" id="ticket-name" required hint="예: 무료 입장, 유료 입장, VIP" error={errors.name}>
          <input
            id="ticket-name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="예: VIP"
            className={fieldControlClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="가격" id="ticket-price" required hint="무료는 0" error={errors.price}>
            <input
              id="ticket-price"
              inputMode="numeric"
              value={form.price}
              onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
              placeholder="0"
              className={fieldControlClass}
            />
          </Field>
          <Field label="정원(쿼터)" id="ticket-quota" required error={errors.quota}>
            <input
              id="ticket-quota"
              inputMode="numeric"
              value={form.quota}
              onChange={(event) => setForm((prev) => ({ ...prev, quota: event.target.value }))}
              placeholder="100"
              className={fieldControlClass}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
          {!isNew ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="px-4 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
            >
              삭제
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="flex h-11 items-center justify-center gap-2 bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-default disabled:bg-muted"
          >
            {isSaving && <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />}
            저장
          </button>
        </div>
      </form>
    </div>
  )
}

export default function TicketTypesPage() {
  const exhibition = useCurrentExhibition()
  const exhibitionId = exhibition.data?.id ?? null

  const ticketTypes = useTicketTypes(exhibitionId)
  const [editingTarget, setEditingTarget] = useState<EditingTarget>(null)

  const data = ticketTypes.data ?? []
  const editingTicketType = typeof editingTarget === 'number' ? data.find((ticket) => ticket.id === editingTarget) ?? null : null

  const columns: DataTableColumn<TicketType>[] = [
    {
      key: 'name',
      header: '티켓 이름',
      sortable: true,
    },
    {
      key: 'price',
      header: '가격',
      align: 'right',
      sortable: true,
      render: (row) => (row.price === 0 ? '무료' : formatCurrency(row.price)),
    },
    {
      key: 'quota',
      header: '정원',
      align: 'right',
      sortable: true,
      render: (row) => `${row.quota.toLocaleString()}매`,
    },
    {
      key: 'remaining',
      header: '남은 쿼터',
      align: 'right',
      sortable: true,
      sortValue: (row) => getRemainingQuota(row),
      render: (row) => {
        const remaining = getRemainingQuota(row)
        const badge = getQuotaBadge(remaining, row.quota)
        return (
          <div className="flex items-center justify-end gap-2">
            <span className="font-semibold text-ink">{remaining.toLocaleString()}매</span>
            {badge && <span className={`px-2 py-0.5 text-[10.5px] font-bold ${badge.className}`}>{badge.label}</span>}
          </div>
        )
      },
    },
  ]

  if (exhibition.isError) {
    return <p className="text-sm text-danger">행사 정보를 불러오지 못했습니다.</p>
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">티켓 관리</h1>
          <p className="mt-1 text-sm text-muted">
            무료·유료·VIP 등 티켓 타입별 가격과 정원을 설정합니다. 총 <b className="text-ink">{data.length.toLocaleString()}</b>종
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditingTarget('new')}
          className="flex items-center gap-2 bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
        >
          <PlusIcon />
          티켓 추가
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <DataTable
            columns={columns}
            data={data}
            rowKey={(row) => row.id}
            isLoading={exhibition.isLoading || ticketTypes.isLoading}
            isError={ticketTypes.isError}
            emptyMessage="등록된 티켓이 없습니다. 티켓을 추가해보세요."
            pageSize={8}
            onRowClick={(row) => setEditingTarget(row.id)}
          />
        </div>

        {editingTarget !== null && exhibitionId !== null && (
          <TicketTypeEditorPanel
            key={typeof editingTarget === 'number' ? editingTarget : 'new'}
            ticketType={editingTicketType}
            exhibitionId={exhibitionId}
            onClose={() => setEditingTarget(null)}
          />
        )}
      </div>
    </div>
  )
}
