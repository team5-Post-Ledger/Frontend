import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { Field, fieldControlClass } from '../../components/Field'
import { useCurrentExhibition } from '../../features/exhibition/hooks'
import { useCreateTimeSlot, useDeleteTimeSlot, useTimeSlots, useUpdateTimeSlot } from '../../features/timeSlot/hooks'
import { formatSlotRange } from '../../features/timeSlot/format'
import type { TimeSlotInput } from '../../lib/api/timeSlots'
import type { TimeSlot } from '../../types'

type EditingTarget = 'new' | number | null

interface TimeSlotFormState {
  startAt: string
  endAt: string
  capacity: string
}

type TimeSlotFormErrors = Partial<Record<keyof TimeSlotFormState, string>>

function timeSlotToFormState(slot: TimeSlot | null): TimeSlotFormState {
  if (!slot) return { startAt: '', endAt: '', capacity: '' }
  return { startAt: slot.startAt, endAt: slot.endAt, capacity: String(slot.capacity) }
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

function getSlotStatus(slot: TimeSlot): { label: string; className: string } {
  const remaining = slot.capacity - slot.reservedCount
  if (remaining <= 0) return { label: '마감', className: 'bg-danger text-white' }
  if (slot.capacity > 0 && slot.reservedCount / slot.capacity >= 0.9) return { label: '임박', className: 'bg-warning text-white' }
  return { label: '여유', className: 'bg-line text-muted' }
}

function TimeSlotEditorPanel({
  slot,
  exhibitionId,
  onClose,
}: {
  slot: TimeSlot | null
  exhibitionId: number
  onClose: () => void
}) {
  const isNew = slot === null
  const [form, setForm] = useState<TimeSlotFormState>(() => timeSlotToFormState(slot))
  const [errors, setErrors] = useState<TimeSlotFormErrors>({})

  const createMutation = useCreateTimeSlot()
  const updateMutation = useUpdateTimeSlot()
  const deleteMutation = useDeleteTimeSlot()

  const isSaving = createMutation.isPending || updateMutation.isPending

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: TimeSlotFormErrors = {}
    if (!form.startAt) nextErrors.startAt = '시작 시간을 입력해주세요.'
    if (!form.endAt) nextErrors.endAt = '종료 시간을 입력해주세요.'
    if (form.startAt && form.endAt && new Date(form.startAt) >= new Date(form.endAt)) {
      nextErrors.endAt = '종료 시간은 시작 시간보다 늦어야 합니다.'
    }
    if (form.capacity.trim() === '' || Number.isNaN(Number(form.capacity)) || Number(form.capacity) < 1) {
      nextErrors.capacity = '1 이상의 숫자를 입력해주세요.'
    } else if (!isNew && slot && Number(form.capacity) < slot.reservedCount) {
      nextErrors.capacity = `이미 예약된 ${slot.reservedCount.toLocaleString()}명보다 작게 설정할 수 없습니다.`
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const input: TimeSlotInput = {
      startAt: form.startAt,
      endAt: form.endAt,
      capacity: Number(form.capacity),
    }

    if (isNew) {
      createMutation.mutate({ exhibitionId, input }, { onSuccess: onClose })
    } else if (slot) {
      updateMutation.mutate({ id: slot.id, input }, { onSuccess: onClose })
    }
  }

  function handleDelete() {
    if (!slot) return
    deleteMutation.mutate(slot.id, { onSuccess: onClose })
  }

  return (
    <div className="w-full shrink-0 border border-line bg-white lg:sticky lg:top-6 lg:w-[380px]">
      <div className="flex items-start justify-between gap-3 border-b border-line p-5">
        <div>
          <div className="text-lg font-extrabold tracking-tight text-ink">{isNew ? '새 슬롯' : formatSlotRange(slot.startAt, slot.endAt)}</div>
          <div className="mt-0.5 text-xs text-muted">{isNew ? '신규 예약 슬롯을 등록합니다.' : `정원 ${slot.capacity.toLocaleString()}명`}</div>
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
        {!isNew && slot && (
          <div className="flex items-center justify-between gap-3 border border-line bg-surface p-3">
            <span className="text-xs font-semibold text-muted">현재 예약 인원</span>
            <span className="text-sm font-bold text-ink">{slot.reservedCount.toLocaleString()}명</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="시작 시간" id="slot-start" required error={errors.startAt}>
            <input
              id="slot-start"
              type="datetime-local"
              value={form.startAt}
              onChange={(event) => setForm((prev) => ({ ...prev, startAt: event.target.value }))}
              className={fieldControlClass}
            />
          </Field>
          <Field label="종료 시간" id="slot-end" required error={errors.endAt}>
            <input
              id="slot-end"
              type="datetime-local"
              value={form.endAt}
              onChange={(event) => setForm((prev) => ({ ...prev, endAt: event.target.value }))}
              className={fieldControlClass}
            />
          </Field>
        </div>

        <Field
          label="정원"
          id="slot-capacity"
          required
          hint={!isNew && slot ? `현재 예약 ${slot.reservedCount.toLocaleString()}명 미만으로 줄일 수 없습니다.` : undefined}
          error={errors.capacity}
        >
          <input
            id="slot-capacity"
            inputMode="numeric"
            value={form.capacity}
            onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))}
            placeholder="200"
            className={fieldControlClass}
          />
        </Field>

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

export default function TimeSlotsPage() {
  const exhibition = useCurrentExhibition()
  const exhibitionId = exhibition.data?.id ?? null

  const timeSlots = useTimeSlots(exhibitionId)
  const [editingTarget, setEditingTarget] = useState<EditingTarget>(null)

  // 시간 기준 정렬을 기본값으로 보여준다. DataTable 헤더를 눌러 다른 기준으로 다시 정렬할 수 있다.
  const sortedSlots = useMemo(
    () => [...(timeSlots.data ?? [])].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [timeSlots.data],
  )

  const editingSlot = typeof editingTarget === 'number' ? sortedSlots.find((slot) => slot.id === editingTarget) ?? null : null

  const columns: DataTableColumn<TimeSlot>[] = [
    {
      key: 'time',
      header: '시간',
      sortable: true,
      sortValue: (row) => new Date(row.startAt).getTime(),
      render: (row) => formatSlotRange(row.startAt, row.endAt),
    },
    {
      key: 'capacity',
      header: '정원',
      align: 'right',
      sortable: true,
      render: (row) => `${row.capacity.toLocaleString()}명`,
    },
    {
      key: 'reservedCount',
      header: '예약',
      align: 'right',
      sortable: true,
      render: (row) => `${row.reservedCount.toLocaleString()}명`,
    },
    {
      key: 'remaining',
      header: '잔여',
      align: 'right',
      sortable: true,
      sortValue: (row) => row.capacity - row.reservedCount,
      render: (row) => `${(row.capacity - row.reservedCount).toLocaleString()}명`,
    },
    {
      key: 'fillRate',
      header: '충원율',
      align: 'right',
      sortable: true,
      sortValue: (row) => (row.capacity > 0 ? row.reservedCount / row.capacity : 0),
      render: (row) => `${row.capacity > 0 ? Math.round((row.reservedCount / row.capacity) * 100) : 0}%`,
    },
    {
      key: 'status',
      header: '상태',
      align: 'center',
      render: (row) => {
        const status = getSlotStatus(row)
        return <span className={`px-2.5 py-1 text-[11px] font-bold ${status.className}`}>{status.label}</span>
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
          <h1 className="text-xl font-extrabold tracking-tight text-ink">예약 슬롯 관리</h1>
          <p className="mt-1 text-sm text-muted">
            시간대별 정원과 예약 현황을 관리합니다. 총 <b className="text-ink">{sortedSlots.length.toLocaleString()}</b>개
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditingTarget('new')}
          className="flex items-center gap-2 bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
        >
          <PlusIcon />
          슬롯 추가
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <DataTable
            columns={columns}
            data={sortedSlots}
            rowKey={(row) => row.id}
            isLoading={exhibition.isLoading || timeSlots.isLoading}
            isError={timeSlots.isError}
            emptyMessage="등록된 예약 슬롯이 없습니다. 슬롯을 추가해보세요."
            pageSize={8}
            onRowClick={(row) => setEditingTarget(row.id)}
          />
        </div>

        {editingTarget !== null && exhibitionId !== null && (
          <TimeSlotEditorPanel
            key={typeof editingTarget === 'number' ? editingTarget : 'new'}
            slot={editingSlot}
            exhibitionId={exhibitionId}
            onClose={() => setEditingTarget(null)}
          />
        )}
      </div>
    </div>
  )
}
