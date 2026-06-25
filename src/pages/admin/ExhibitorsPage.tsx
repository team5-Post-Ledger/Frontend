import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { Field, fieldControlClass } from '../../components/Field'
import { useBoothsByExhibition } from '../../features/booth/hooks'
import { useCurrentExhibition } from '../../features/exhibition/hooks'
import { useCreateExhibitor, useExhibitors, useIssueExhibitorAccount, useUpdateExhibitor } from '../../features/exhibitor/hooks'
import type { ExhibitorInput } from '../../lib/api/exhibitors'
import type { Booth, Exhibitor } from '../../types'

type EditingTarget = 'new' | number | null

interface ExhibitorFormState {
  companyName: string
  intro: string
  website: string
}

type ExhibitorFormErrors = Partial<Record<keyof ExhibitorFormState, string>>

function exhibitorToFormState(exhibitor: Exhibitor | null): ExhibitorFormState {
  if (!exhibitor) return { companyName: '', intro: '', website: '' }
  return { companyName: exhibitor.companyName, intro: exhibitor.intro, website: exhibitor.website ?? '' }
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

function ExhibitorEditorPanel({
  exhibitor,
  exhibitionId,
  connectedBooths,
  onClose,
}: {
  exhibitor: Exhibitor | null
  exhibitionId: number
  connectedBooths: Booth[]
  onClose: () => void
}) {
  const isNew = exhibitor === null
  const [form, setForm] = useState<ExhibitorFormState>(() => exhibitorToFormState(exhibitor))
  const [errors, setErrors] = useState<ExhibitorFormErrors>({})

  const createMutation = useCreateExhibitor()
  const updateMutation = useUpdateExhibitor()
  const issueAccountMutation = useIssueExhibitorAccount()

  const isSaving = createMutation.isPending || updateMutation.isPending

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: ExhibitorFormErrors = {}
    if (!form.companyName.trim()) nextErrors.companyName = '회사명을 입력해주세요.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const input: ExhibitorInput = {
      companyName: form.companyName.trim(),
      intro: form.intro.trim(),
      website: form.website.trim() || null,
    }

    if (isNew) {
      createMutation.mutate({ exhibitionId, input }, { onSuccess: onClose })
    } else if (exhibitor) {
      updateMutation.mutate({ id: exhibitor.id, input }, { onSuccess: onClose })
    }
  }

  return (
    <div className="w-full shrink-0 border border-line bg-white lg:sticky lg:top-6 lg:w-[400px]">
      <div className="flex items-start justify-between gap-3 border-b border-line p-5">
        <div>
          <div className="text-lg font-extrabold tracking-tight text-ink">{isNew ? '참가기업 등록' : exhibitor.companyName}</div>
          <div className="mt-0.5 text-xs text-muted">{isNew ? '신규 참가기업을 등록합니다.' : `부스 ${connectedBooths.length}개 연결됨`}</div>
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5">
        <Field label="회사명" id="exhibitor-company-name" required error={errors.companyName}>
          <input
            id="exhibitor-company-name"
            value={form.companyName}
            onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
            placeholder="예: ㈜테크노바"
            className={fieldControlClass}
          />
        </Field>

        <Field label="소개" id="exhibitor-intro" hint="AI 동선 추천 인덱싱(RAG)에 사용됩니다.">
          <textarea
            id="exhibitor-intro"
            rows={4}
            value={form.intro}
            onChange={(event) => setForm((prev) => ({ ...prev, intro: event.target.value }))}
            placeholder="회사·제품 소개를 입력해주세요."
            className={fieldControlClass}
          />
        </Field>

        <Field label="웹사이트" id="exhibitor-website" hint="선택 입력">
          <input
            id="exhibitor-website"
            value={form.website}
            onChange={(event) => setForm((prev) => ({ ...prev, website: event.target.value }))}
            placeholder="https://"
            className={fieldControlClass}
          />
        </Field>

        <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
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

      {!isNew && exhibitor && (
        <div className="border-t border-line p-5">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted">EXHIBITOR 계정</div>
          {exhibitor.accountUserId !== null ? (
            <div className="flex items-center justify-between border border-line bg-surface px-3 py-2.5">
              <span className="text-sm font-semibold text-ink">발급됨</span>
              <span className="font-mono text-xs text-muted">user #{exhibitor.accountUserId}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between border border-line bg-surface px-3 py-2.5">
                <span className="text-sm font-semibold text-muted">대기</span>
                <span className="text-xs text-muted">계정이 아직 없습니다.</span>
              </div>
              <button
                type="button"
                onClick={() => issueAccountMutation.mutate(exhibitor.id)}
                disabled={issueAccountMutation.isPending}
                className="flex h-10 items-center justify-center gap-2 border border-ink text-sm font-bold text-ink transition-colors hover:bg-ink hover:text-white disabled:cursor-default disabled:opacity-50"
              >
                {issueAccountMutation.isPending && <span className="h-3.5 w-3.5 rounded-full border-2 border-ink/30 border-t-ink motion-safe:animate-spin" />}
                EXHIBITOR 계정 발급
              </button>
              {issueAccountMutation.isError && <p className="text-xs font-medium text-danger">계정 발급 중 오류가 발생했습니다.</p>}
            </div>
          )}

          <div className="mt-5">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">연결된 부스 · {connectedBooths.length}개</div>
            {connectedBooths.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {connectedBooths.map((booth) => (
                  <li key={booth.id} className="border border-line px-3 py-2 text-sm text-ink">
                    {booth.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">연결된 부스가 없습니다.</p>
            )}
            <p className="mt-2 text-xs text-muted">부스 연결 관리는 부스 관리 화면에서 합니다.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ExhibitorsPage() {
  const exhibition = useCurrentExhibition()
  const exhibitionId = exhibition.data?.id ?? null

  const exhibitors = useExhibitors()
  const booths = useBoothsByExhibition(exhibitionId)

  const [searchTerm, setSearchTerm] = useState('')
  const [editingTarget, setEditingTarget] = useState<EditingTarget>(null)

  const scopedExhibitors = useMemo(
    () => (exhibitors.data ?? []).filter((exhibitor) => exhibitor.exhibitionId === exhibitionId),
    [exhibitors.data, exhibitionId],
  )

  const boothsByExhibitor = useMemo(() => {
    const map = new Map<number, Booth[]>()
    booths.data?.forEach((booth) => {
      const list = map.get(booth.exhibitorId) ?? []
      list.push(booth)
      map.set(booth.exhibitorId, list)
    })
    return map
  }, [booths.data])

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return scopedExhibitors
    return scopedExhibitors.filter((exhibitor) => exhibitor.companyName.toLowerCase().includes(term))
  }, [scopedExhibitors, searchTerm])

  const editingExhibitor =
    typeof editingTarget === 'number' ? scopedExhibitors.find((exhibitor) => exhibitor.id === editingTarget) ?? null : null

  const columns: DataTableColumn<Exhibitor>[] = [
    { key: 'companyName', header: '회사명', sortable: true },
    {
      key: 'website',
      header: '웹사이트',
      render: (row) =>
        row.website ? (
          <a
            href={row.website}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="text-primary hover:text-primary-hover"
          >
            {row.website}
          </a>
        ) : (
          '-'
        ),
    },
    {
      key: 'boothCount',
      header: '연결 부스',
      align: 'center',
      sortable: true,
      sortValue: (row) => boothsByExhibitor.get(row.id)?.length ?? 0,
      render: (row) => `${(boothsByExhibitor.get(row.id)?.length ?? 0).toLocaleString()}개`,
    },
    {
      key: 'account',
      header: '계정 발급',
      align: 'center',
      render: (row) => (
        <span className={`px-2.5 py-1 text-[11px] font-bold ${row.accountUserId !== null ? 'bg-success text-white' : 'bg-line text-muted'}`}>
          {row.accountUserId !== null ? '발급됨' : '대기'}
        </span>
      ),
    },
  ]

  if (exhibition.isError) {
    return <p className="text-sm text-danger">행사 정보를 불러오지 못했습니다.</p>
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">참가기업 관리</h1>
          <p className="mt-1 text-sm text-muted">
            참가기업을 등록하고 EXHIBITOR 계정을 발급합니다. 총 <b className="text-ink">{scopedExhibitors.length.toLocaleString()}</b>개사
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditingTarget('new')}
          className="flex items-center gap-2 bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
        >
          <PlusIcon />
          참가기업 등록
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(row) => row.id}
            isLoading={exhibition.isLoading || exhibitors.isLoading}
            isError={exhibitors.isError}
            emptyMessage="등록된 참가기업이 없습니다. 참가기업을 등록해보세요."
            pageSize={8}
            onRowClick={(row) => setEditingTarget(row.id)}
            toolbar={
              <div className="relative min-w-[220px] flex-1">
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="회사명 검색"
                  className="h-10 w-full border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            }
          />
        </div>

        {editingTarget !== null && exhibitionId !== null && (
          <ExhibitorEditorPanel
            key={typeof editingTarget === 'number' ? editingTarget : 'new'}
            exhibitor={editingExhibitor}
            exhibitionId={exhibitionId}
            connectedBooths={typeof editingTarget === 'number' ? boothsByExhibitor.get(editingTarget) ?? [] : []}
            onClose={() => setEditingTarget(null)}
          />
        )}
      </div>
    </div>
  )
}
