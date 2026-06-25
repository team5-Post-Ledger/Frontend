import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { Field, fieldControlClass } from '../../components/Field'
import { useCurrentExhibition } from '../../features/exhibition/hooks'
import { useExhibitors } from '../../features/exhibitor/hooks'
import { useCreateSession, useDeleteSession, useSessions, useUpdateSession } from '../../features/session/hooks'
import { formatSlotRange } from '../../features/timeSlot/format'
import type { SessionInput } from '../../lib/api/sessions'
import type { Exhibitor, Session } from '../../types'

type EditingTarget = 'new' | number | null

interface SessionFormState {
  title: string
  description: string
  location: string
  startAt: string
  endAt: string
  capacity: string
  hostExhibitorId: number | null
}

type SessionFormErrors = Partial<Record<keyof SessionFormState, string>>

function sessionToFormState(session: Session | null): SessionFormState {
  if (!session) {
    return { title: '', description: '', location: '', startAt: '', endAt: '', capacity: '', hostExhibitorId: null }
  }
  return {
    title: session.title,
    description: session.description,
    location: session.location,
    startAt: session.startAt,
    endAt: session.endAt,
    capacity: String(session.capacity),
    hostExhibitorId: session.hostExhibitorId,
  }
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

function SessionEditorPanel({
  session,
  exhibitionId,
  exhibitorOptions,
  onClose,
}: {
  session: Session | null
  exhibitionId: number
  exhibitorOptions: Exhibitor[]
  onClose: () => void
}) {
  const isNew = session === null
  const [form, setForm] = useState<SessionFormState>(() => sessionToFormState(session))
  const [errors, setErrors] = useState<SessionFormErrors>({})

  const createMutation = useCreateSession()
  const updateMutation = useUpdateSession()
  const deleteMutation = useDeleteSession()

  const isSaving = createMutation.isPending || updateMutation.isPending

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: SessionFormErrors = {}
    if (!form.title.trim()) nextErrors.title = '세션 제목을 입력해주세요.'
    if (!form.location.trim()) nextErrors.location = '장소를 입력해주세요.'
    if (!form.startAt) nextErrors.startAt = '시작 시간을 입력해주세요.'
    if (!form.endAt) nextErrors.endAt = '종료 시간을 입력해주세요.'
    if (form.startAt && form.endAt && new Date(form.startAt) >= new Date(form.endAt)) {
      nextErrors.endAt = '종료 시간은 시작 시간보다 늦어야 합니다.'
    }
    if (form.capacity.trim() === '' || Number.isNaN(Number(form.capacity)) || Number(form.capacity) < 1) {
      nextErrors.capacity = '1 이상의 숫자를 입력해주세요.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const input: SessionInput = {
      hostExhibitorId: form.hostExhibitorId,
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      startAt: form.startAt,
      endAt: form.endAt,
      capacity: Number(form.capacity),
    }

    if (isNew) {
      createMutation.mutate({ exhibitionId, input }, { onSuccess: onClose })
    } else if (session) {
      updateMutation.mutate({ id: session.id, input }, { onSuccess: onClose })
    }
  }

  function handleDelete() {
    if (!session) return
    deleteMutation.mutate(session.id, { onSuccess: onClose })
  }

  return (
    <div className="w-full shrink-0 border border-line bg-white lg:sticky lg:top-6 lg:w-[420px]">
      <div className="flex items-start justify-between gap-3 border-b border-line p-5">
        <div>
          <div className="text-lg font-extrabold tracking-tight text-ink">{isNew ? '새 세션' : session.title}</div>
          <div className="mt-0.5 text-xs text-muted">{isNew ? '신규 세션을 등록합니다.' : session.location}</div>
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
        <Field label="제목" id="session-title" required error={errors.title}>
          <input
            id="session-title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="예: 키노트: 제조의 미래와 AI"
            className={fieldControlClass}
          />
        </Field>

        <Field label="설명" id="session-description" hint="세션 소개 내용을 입력하세요.">
          <textarea
            id="session-description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="세션 소개"
            rows={3}
            className={`${fieldControlClass} resize-none`}
          />
        </Field>

        <Field label="장소" id="session-location" required error={errors.location}>
          <input
            id="session-location"
            value={form.location}
            onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
            placeholder="예: 세미나실 B"
            className={fieldControlClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="시작 시간" id="session-start" required error={errors.startAt}>
            <input
              id="session-start"
              type="datetime-local"
              value={form.startAt}
              onChange={(event) => setForm((prev) => ({ ...prev, startAt: event.target.value }))}
              className={fieldControlClass}
            />
          </Field>
          <Field label="종료 시간" id="session-end" required error={errors.endAt}>
            <input
              id="session-end"
              type="datetime-local"
              value={form.endAt}
              onChange={(event) => setForm((prev) => ({ ...prev, endAt: event.target.value }))}
              className={fieldControlClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="정원" id="session-capacity" required error={errors.capacity}>
            <input
              id="session-capacity"
              inputMode="numeric"
              value={form.capacity}
              onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))}
              placeholder="100"
              className={fieldControlClass}
            />
          </Field>
          <Field label="담당 참가기업" id="session-host" hint="없으면 비워두세요.">
            <select
              id="session-host"
              value={form.hostExhibitorId ?? ''}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, hostExhibitorId: event.target.value ? Number(event.target.value) : null }))
              }
              className={fieldControlClass}
            >
              <option value="">담당 없음</option>
              {exhibitorOptions.map((exhibitor) => (
                <option key={exhibitor.id} value={exhibitor.id}>
                  {exhibitor.companyName}
                </option>
              ))}
            </select>
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

export default function SessionsPage() {
  const exhibition = useCurrentExhibition()
  const exhibitionId = exhibition.data?.id ?? null

  const sessions = useSessions(exhibitionId)
  const exhibitors = useExhibitors()
  const [editingTarget, setEditingTarget] = useState<EditingTarget>(null)

  const exhibitorOptions = useMemo(
    () => (exhibitors.data ?? []).filter((exhibitor) => exhibitor.exhibitionId === exhibitionId),
    [exhibitors.data, exhibitionId],
  )

  // 시간 기준 정렬을 기본값으로 보여준다. DataTable 헤더를 눌러 다른 기준으로 다시 정렬할 수 있다.
  const sortedSessions = useMemo(
    () => [...(sessions.data ?? [])].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [sessions.data],
  )

  const editingSession =
    typeof editingTarget === 'number' ? sortedSessions.find((session) => session.id === editingTarget) ?? null : null

  const columns: DataTableColumn<Session>[] = [
    {
      key: 'title',
      header: '제목',
      sortable: true,
    },
    {
      key: 'location',
      header: '장소',
      sortable: true,
    },
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
  ]

  if (exhibition.isError) {
    return <p className="text-sm text-danger">행사 정보를 불러오지 못했습니다.</p>
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">세션 관리</h1>
          <p className="mt-1 text-sm text-muted">
            세션 정원·시간·장소를 관리합니다. 총 <b className="text-ink">{sortedSessions.length.toLocaleString()}</b>건
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditingTarget('new')}
          className="flex items-center gap-2 bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
        >
          <PlusIcon />
          세션 추가
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <DataTable
            columns={columns}
            data={sortedSessions}
            rowKey={(row) => row.id}
            isLoading={exhibition.isLoading || sessions.isLoading}
            isError={sessions.isError}
            emptyMessage="등록된 세션이 없습니다. 세션을 추가해보세요."
            pageSize={8}
            onRowClick={(row) => setEditingTarget(row.id)}
          />
        </div>

        {editingTarget !== null && exhibitionId !== null && (
          <SessionEditorPanel
            key={typeof editingTarget === 'number' ? editingTarget : 'new'}
            session={editingSession}
            exhibitionId={exhibitionId}
            exhibitorOptions={exhibitorOptions}
            onClose={() => setEditingTarget(null)}
          />
        )}
      </div>
    </div>
  )
}
