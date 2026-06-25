import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { Field, fieldControlClass } from '../../components/Field'
import {
  useBoothCategories,
  useBoothEmbeddings,
  useBooths,
  useCreateBooth,
  useDeleteBooth,
  useRegenerateBoothEmbedding,
  useUpdateBooth,
} from '../../features/booth/hooks'
import { useExhibitors } from '../../features/exhibitor/hooks'
import type { BoothInput } from '../../lib/api/booths'
import { formatDateTime } from '../../lib/format'
import { useCurrentExhibitionStore } from '../../stores/currentExhibitionStore'
import type { Booth, BoothCategory, BoothEmbedding, Exhibitor } from '../../types'

type EditingTarget = 'new' | number | null

interface BoothFormState {
  name: string
  categoryId: number | null
  description: string
  tags: string[]
  tagInput: string
  floor: string
  posX: string
  posY: string
  exhibitorId: number | null
}

type BoothFormErrors = Partial<Record<keyof BoothFormState, string>>

function boothToFormState(booth: Booth | null): BoothFormState {
  if (!booth) {
    return { name: '', categoryId: null, description: '', tags: [], tagInput: '', floor: '', posX: '', posY: '', exhibitorId: null }
  }
  return {
    name: booth.name,
    categoryId: booth.categoryId,
    description: booth.description,
    tags: booth.tags,
    tagInput: '',
    floor: String(booth.floor),
    posX: String(booth.posX),
    posY: String(booth.posY),
    exhibitorId: booth.exhibitorId,
  }
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  )
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

function BoothEditorPanel({
  booth,
  categories,
  exhibitors,
  embedding,
  exhibitionId,
  onClose,
}: {
  booth: Booth | null
  categories: BoothCategory[]
  exhibitors: Exhibitor[]
  embedding: BoothEmbedding | null
  exhibitionId: number | null
  onClose: () => void
}) {
  const isNew = booth === null
  const [form, setForm] = useState<BoothFormState>(() => boothToFormState(booth))
  const [errors, setErrors] = useState<BoothFormErrors>({})
  const [justRegenerated, setJustRegenerated] = useState(false)

  const createBoothMutation = useCreateBooth(exhibitionId)
  const updateBoothMutation = useUpdateBooth(exhibitionId)
  const deleteBoothMutation = useDeleteBooth()
  const regenerateEmbeddingMutation = useRegenerateBoothEmbedding()

  const isSaving = createBoothMutation.isPending || updateBoothMutation.isPending

  function addTag() {
    const value = form.tagInput.trim()
    if (!value || form.tags.includes(value)) {
      setForm((prev) => ({ ...prev, tagInput: '' }))
      return
    }
    setForm((prev) => ({ ...prev, tags: [...prev.tags, value], tagInput: '' }))
  }

  function removeTag(tag: string) {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((existing) => existing !== tag) }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: BoothFormErrors = {}
    if (!form.name.trim()) nextErrors.name = '부스 이름을 입력해주세요.'
    if (!form.description.trim()) nextErrors.description = '설명을 입력해주세요.'
    if (form.exhibitorId === null) nextErrors.exhibitorId = '참가기업을 선택해주세요.'
    if (form.floor.trim() === '' || Number.isNaN(Number(form.floor))) nextErrors.floor = '숫자를 입력해주세요.'
    if (form.posX.trim() === '' || Number.isNaN(Number(form.posX))) nextErrors.posX = '숫자를 입력해주세요.'
    if (form.posY.trim() === '' || Number.isNaN(Number(form.posY))) nextErrors.posY = '숫자를 입력해주세요.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const input: BoothInput = {
      exhibitorId: form.exhibitorId as number,
      categoryId: form.categoryId,
      name: form.name.trim(),
      description: form.description.trim(),
      tags: form.tags,
      posX: Number(form.posX),
      posY: Number(form.posY),
      floor: Number(form.floor),
    }

    if (isNew) {
      createBoothMutation.mutate(input, { onSuccess: onClose })
    } else if (booth) {
      updateBoothMutation.mutate({ id: booth.id, input }, { onSuccess: onClose })
    }
  }

  function handleDelete() {
    if (!booth) return
    deleteBoothMutation.mutate(booth.id, { onSuccess: onClose })
  }

  function handleRegenerate() {
    if (!booth) return
    regenerateEmbeddingMutation.mutate(booth.id, {
      onSuccess: () => {
        setJustRegenerated(true)
        setTimeout(() => setJustRegenerated(false), 2000)
      },
    })
  }

  return (
    <div className="w-full shrink-0 border border-line bg-white lg:sticky lg:top-6 lg:w-[420px]">
      <div className="flex items-start justify-between gap-3 border-b border-line p-5">
        <div>
          <div className="text-lg font-extrabold tracking-tight text-ink">{isNew ? '새 부스' : booth.name}</div>
          <div className="mt-0.5 text-xs text-muted">
            {isNew ? '신규 부스를 등록합니다.' : `${booth.floor}F · (${booth.posX}, ${booth.posY})`}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.4fr_1fr]">
          <Field label="부스 이름" id="booth-name" required error={errors.name}>
            <input
              id="booth-name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="예: 테크노바 · AI 솔루션"
              className={fieldControlClass}
            />
          </Field>
          <Field label="카테고리" id="booth-category">
            <select
              id="booth-category"
              value={form.categoryId ?? ''}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, categoryId: event.target.value ? Number(event.target.value) : null }))
              }
              className={fieldControlClass}
            >
              <option value="">카테고리 없음</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="설명" id="booth-description" required hint="AI 동선 추천·검색 임베딩에 사용됩니다." error={errors.description}>
          <textarea
            id="booth-description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="부스 소개 및 전시 내용"
            rows={3}
            className={`${fieldControlClass} resize-none`}
          />
        </Field>

        <Field label="태그" id="booth-tag-input" hint="Enter로 태그를 추가하세요. AI 동선 추천 검색에 사용됩니다.">
          <div className="flex flex-wrap items-center gap-2 border border-line bg-white px-3 py-2.5">
            {form.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1.5 bg-surface px-2.5 py-1 text-xs font-semibold text-ink">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`${tag} 삭제`}
                  className="text-muted transition-colors hover:text-danger"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              id="booth-tag-input"
              value={form.tagInput}
              onChange={(event) => setForm((prev) => ({ ...prev, tagInput: event.target.value }))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addTag()
                }
              }}
              placeholder={form.tags.length === 0 ? '태그 입력 후 Enter' : '태그 추가'}
              className="min-w-[100px] flex-1 border-none p-0 text-sm text-ink outline-none"
            />
          </div>
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="층" id="booth-floor" required error={errors.floor}>
            <input
              id="booth-floor"
              inputMode="numeric"
              value={form.floor}
              onChange={(event) => setForm((prev) => ({ ...prev, floor: event.target.value }))}
              className={fieldControlClass}
            />
          </Field>
          <Field label="posX" id="booth-posx" required error={errors.posX}>
            <input
              id="booth-posx"
              inputMode="numeric"
              value={form.posX}
              onChange={(event) => setForm((prev) => ({ ...prev, posX: event.target.value }))}
              className={fieldControlClass}
            />
          </Field>
          <Field label="posY" id="booth-posy" required error={errors.posY}>
            <input
              id="booth-posy"
              inputMode="numeric"
              value={form.posY}
              onChange={(event) => setForm((prev) => ({ ...prev, posY: event.target.value }))}
              className={fieldControlClass}
            />
          </Field>
        </div>

        <Field label="참가기업 연결" id="booth-exhibitor" required error={errors.exhibitorId}>
          <select
            id="booth-exhibitor"
            value={form.exhibitorId ?? ''}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, exhibitorId: event.target.value ? Number(event.target.value) : null }))
            }
            className={fieldControlClass}
          >
            <option value="">참가기업 선택</option>
            {exhibitors.map((exhibitor) => (
              <option key={exhibitor.id} value={exhibitor.id}>
                {exhibitor.companyName}
              </option>
            ))}
          </select>
        </Field>

        {!isNew && (
          <div className="flex items-center justify-between gap-3 border border-line bg-surface p-4">
            <div>
              <div className="text-sm font-bold text-ink">RAG 인덱싱</div>
              <div className="mt-0.5 text-xs text-muted">
                {embedding ? `생성됨 · ${formatDateTime(embedding.updatedAt)}` : '아직 생성되지 않았습니다.'}
              </div>
            </div>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerateEmbeddingMutation.isPending}
              className="shrink-0 border border-line bg-white px-3 py-2 text-xs font-semibold text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
            >
              {justRegenerated ? '재생성 완료' : regenerateEmbeddingMutation.isPending ? '재생성 중...' : '임베딩 재생성'}
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
          {!isNew ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteBoothMutation.isPending}
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

export default function BoothsPage() {
  const exhibitionId = useCurrentExhibitionStore((state) => state.exhibitionId)
  const booths = useBooths(exhibitionId)
  const categories = useBoothCategories()
  const exhibitors = useExhibitors()
  const embeddings = useBoothEmbeddings()

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<number | 'ALL'>('ALL')
  const [editingTarget, setEditingTarget] = useState<EditingTarget>(null)

  const categoryNameById = useMemo(() => {
    const map = new Map<number, string>()
    categories.data?.forEach((category) => map.set(category.id, category.name))
    return map
  }, [categories.data])

  const exhibitorNameById = useMemo(() => {
    const map = new Map<number, string>()
    exhibitors.data?.forEach((exhibitor) => map.set(exhibitor.id, exhibitor.companyName))
    return map
  }, [exhibitors.data])

  const embeddingByBoothId = useMemo(() => {
    const map = new Map<number, BoothEmbedding>()
    embeddings.data?.forEach((embedding) => map.set(embedding.boothId, embedding))
    return map
  }, [embeddings.data])

  const filtered = useMemo(() => {
    const data = booths.data ?? []
    const term = searchTerm.trim().toLowerCase()

    return data.filter((booth) => {
      if (categoryFilter !== 'ALL' && booth.categoryId !== categoryFilter) return false
      if (!term) return true
      const haystack = `${booth.name} ${booth.tags.join(' ')}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [booths.data, searchTerm, categoryFilter])

  const editingBooth =
    typeof editingTarget === 'number' ? booths.data?.find((booth) => booth.id === editingTarget) ?? null : null

  const columns: DataTableColumn<Booth>[] = [
    {
      key: 'name',
      header: '부스명',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-ink">{row.name}</div>
          {row.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {row.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="bg-surface px-1.5 py-0.5 text-[10.5px] text-muted">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: '카테고리',
      render: (row) => (row.categoryId ? categoryNameById.get(row.categoryId) ?? '-' : '-'),
    },
    {
      key: 'location',
      header: '층/좌표',
      sortable: true,
      sortValue: (row) => row.floor,
      render: (row) => `${row.floor}F · (${row.posX}, ${row.posY})`,
    },
    {
      key: 'exhibitor',
      header: '참가기업',
      render: (row) => exhibitorNameById.get(row.exhibitorId) ?? '-',
    },
    {
      key: 'rag',
      header: 'RAG 인덱싱',
      render: (row) => {
        const hasEmbedding = embeddingByBoothId.has(row.id)
        return (
          <span className={`px-2.5 py-1 text-[11px] font-bold ${hasEmbedding ? 'bg-success text-white' : 'bg-line text-muted'}`}>
            {hasEmbedding ? '생성됨' : '대기중'}
          </span>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">부스 관리</h1>
          <p className="mt-1 text-sm text-muted">
            총 <b className="text-ink">{(booths.data?.length ?? 0).toLocaleString()}</b>개 · 표시{' '}
            {filtered.length.toLocaleString()}개
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditingTarget('new')}
          className="flex items-center gap-2 bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
        >
          <PlusIcon />
          부스 추가
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(row) => row.id}
            isLoading={booths.isLoading}
            isError={booths.isError}
            emptyMessage="조건에 맞는 부스가 없습니다."
            pageSize={8}
            onRowClick={(row) => setEditingTarget(row.id)}
            toolbar={
              <>
                <div className="relative min-w-[200px] flex-1">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
                    <SearchIcon />
                  </span>
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="부스명 · 태그 검색"
                    className="h-10 w-full border border-line bg-surface pl-9 pr-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('ALL')}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                      categoryFilter === 'ALL' ? 'bg-ink text-white' : 'border border-line text-muted hover:text-ink'
                    }`}
                  >
                    전체
                  </button>
                  {categories.data?.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setCategoryFilter(category.id)}
                      className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                        categoryFilter === category.id ? 'bg-ink text-white' : 'border border-line text-muted hover:text-ink'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </>
            }
          />
        </div>

        {editingTarget !== null && (
          <BoothEditorPanel
            key={typeof editingTarget === 'number' ? editingTarget : 'new'}
            booth={editingBooth}
            categories={categories.data ?? []}
            exhibitors={exhibitors.data ?? []}
            embedding={editingBooth ? embeddingByBoothId.get(editingBooth.id) ?? null : null}
            exhibitionId={exhibitionId}
            onClose={() => setEditingTarget(null)}
          />
        )}
      </div>
    </div>
  )
}
