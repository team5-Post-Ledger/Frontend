import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { Field, fieldControlClass } from '../../components/Field'
import { StatCard } from '../../components/StatCard'
import { useCurrentExhibition } from '../../features/exhibition/hooks'
import { useCreateNameTagBatch, useNameTagSummary, useNameTags } from '../../features/nameTag/hooks'
import { formatDateTime } from '../../lib/format'
import type { NameTagView } from '../../lib/api/nameTags'
import type { NameTagStatus } from '../../types'

const STATUS_FILTERS: Array<{ value: NameTagStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'AVAILABLE', label: 'AVAILABLE' },
  { value: 'ISSUED', label: 'ISSUED' },
  { value: 'REVOKED', label: 'REVOKED' },
]

const STATUS_BADGE: Record<NameTagStatus, { label: string; className: string }> = {
  AVAILABLE: { label: 'AVAILABLE', className: 'border border-line bg-white text-muted' },
  ISSUED: { label: 'ISSUED', className: 'bg-live text-ink' },
  REVOKED: { label: 'REVOKED', className: 'bg-line text-muted' },
}

function abbreviateToken(token: string): string {
  return token.length <= 14 ? token : `${token.slice(0, 8)}…${token.slice(-4)}`
}

function NameTagStatusBadge({ status }: { status: NameTagStatus }) {
  const badge = STATUS_BADGE[status]
  return <span className={`px-2.5 py-1 text-[11px] font-bold ${badge.className}`}>{badge.label}</span>
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

function PrintPreviewCard({ exhibitionTitle, token }: { exhibitionTitle: string; token: string }) {
  return (
    <div className="flex flex-col items-center gap-3 border border-line bg-white p-5 text-center">
      <div className="text-sm font-bold text-ink">{exhibitionTitle}</div>
      <div className="flex h-28 w-28 items-center justify-center border-2 border-dashed border-line bg-surface text-xs font-semibold text-muted">
        QR
      </div>
      <div className="font-mono text-[11px] text-muted">{abbreviateToken(token)}</div>
    </div>
  )
}

function BatchCreatePanel({
  exhibitionId,
  onClose,
  onCreated,
}: {
  exhibitionId: number
  onClose: () => void
  onCreated: (createdIds: number[]) => void
}) {
  const [count, setCount] = useState('20')
  const [error, setError] = useState<string | undefined>()
  const [createdCount, setCreatedCount] = useState<number | null>(null)

  const createBatch = useCreateNameTagBatch()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const value = Number(count)
    if (count.trim() === '' || Number.isNaN(value) || value < 1 || value > 500) {
      setError('1~500 사이의 숫자를 입력해주세요.')
      return
    }
    setError(undefined)

    createBatch.mutate(
      { exhibitionId, count: value },
      {
        onSuccess: (created) => {
          setCreatedCount(created.length)
          onCreated(created.map((tag) => tag.id))
        },
      },
    )
  }

  return (
    <div className="w-full shrink-0 border border-line bg-white lg:sticky lg:top-6 lg:w-[340px]">
      <div className="flex items-start justify-between gap-3 border-b border-line p-5">
        <div>
          <div className="text-lg font-extrabold tracking-tight text-ink">토큰 일괄 생성</div>
          <div className="mt-0.5 text-xs text-muted">행사명+QR만 인쇄됩니다. 개인 이름은 담지 않습니다.</div>
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
        <Field label="생성 개수" id="batch-count" required hint="한 번에 최대 500개까지 생성할 수 있습니다." error={error}>
          <input
            id="batch-count"
            inputMode="numeric"
            value={count}
            onChange={(event) => {
              setCount(event.target.value)
              setCreatedCount(null)
            }}
            className={fieldControlClass}
          />
        </Field>

        {createdCount !== null && (
          <div className="border border-line bg-surface p-3 text-xs font-semibold text-ink">
            {createdCount.toLocaleString()}개 생성됨 · AVAILABLE 재고에 추가되고 인쇄 미리보기가 열렸습니다.
          </div>
        )}

        <button
          type="submit"
          disabled={createBatch.isPending}
          className="flex h-11 items-center justify-center gap-2 bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-default disabled:bg-muted"
        >
          {createBatch.isPending && <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />}
          생성
        </button>
      </form>
    </div>
  )
}

export default function NameTagsPage() {
  const exhibition = useCurrentExhibition()
  const exhibitionId = exhibition.data?.id ?? null

  const summary = useNameTagSummary(exhibitionId)

  const [statusFilter, setStatusFilter] = useState<NameTagStatus | 'ALL'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [printIds, setPrintIds] = useState<number[] | null>(null)
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)

  const tags = useNameTags(exhibitionId, statusFilter === 'ALL' ? undefined : statusFilter)
  // 인쇄 미리보기는 현재 상태 필터와 무관하게 조회되어야 해서(방금 생성한 AVAILABLE 토큰을 ISSUED
  // 필터 화면에서도 인쇄할 수 있도록) 전체 목록을 따로 둔다.
  const allTags = useNameTags(exhibitionId)

  const filteredTags = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const data = tags.data ?? []
    if (!term) return data
    return data.filter((tag) => tag.token.toLowerCase().includes(term))
  }, [tags.data, searchTerm])

  const allSelected = filteredTags.length > 0 && filteredTags.every((tag) => selectedIds.has(tag.id))

  function toggleSelected(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(filteredTags.map((tag) => tag.id)))
  }

  const printTags = useMemo(() => {
    if (!printIds) return []
    const byId = new Map((allTags.data ?? []).map((tag) => [tag.id, tag]))
    return printIds.map((id) => byId.get(id)).filter((tag): tag is NameTagView => tag !== undefined)
  }, [printIds, allTags.data])

  const columns: DataTableColumn<NameTagView>[] = [
    {
      key: 'select',
      header: '선택',
      width: '56px',
      render: (row) => (
        <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelected(row.id)} className="h-4 w-4 accent-primary" />
      ),
    },
    {
      key: 'token',
      header: '토큰',
      render: (row) => <span className="font-mono text-xs text-ink">{abbreviateToken(row.token)}</span>,
    },
    {
      key: 'status',
      header: '상태',
      render: (row) => <NameTagStatusBadge status={row.status} />,
    },
    {
      key: 'attendeeName',
      header: '바인딩된 참석자',
      render: (row) => row.attendeeName ?? '-',
    },
    {
      key: 'issuedAt',
      header: '바인딩 시각',
      sortable: true,
      sortValue: (row) => (row.issuedAt ? new Date(row.issuedAt).getTime() : 0),
      render: (row) => (row.issuedAt ? formatDateTime(row.issuedAt) : '-'),
    },
  ]

  if (exhibition.isError) {
    return <p className="text-sm text-danger">행사 정보를 불러오지 못했습니다.</p>
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">네임태그 재고</h1>
          <p className="mt-1 text-sm text-muted">토큰을 사전 생성하고 AVAILABLE·ISSUED·REVOKED 현황을 확인합니다.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreatePanelOpen(true)}
          className="flex items-center gap-2 bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
        >
          <PlusIcon />
          토큰 일괄 생성
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="AVAILABLE (미바인딩)" isLoading={summary.isLoading} isError={summary.isError}>
          {summary.data && (
            <div className="text-[28px] font-extrabold leading-none tracking-tight text-ink">{summary.data.available.toLocaleString()}</div>
          )}
        </StatCard>
        <StatCard label="ISSUED (바인딩됨)" isLoading={summary.isLoading} isError={summary.isError}>
          {summary.data && (
            <div className="text-[28px] font-extrabold leading-none tracking-tight text-ink">{summary.data.issued.toLocaleString()}</div>
          )}
        </StatCard>
        <StatCard label="REVOKED (회수됨)" isLoading={summary.isLoading} isError={summary.isError}>
          {summary.data && (
            <div className="text-[28px] font-extrabold leading-none tracking-tight text-ink">{summary.data.revoked.toLocaleString()}</div>
          )}
        </StatCard>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <DataTable
            columns={columns}
            data={filteredTags}
            rowKey={(row) => row.id}
            isLoading={exhibition.isLoading || tags.isLoading}
            isError={tags.isError}
            emptyMessage="조건에 맞는 네임태그가 없습니다."
            pageSize={8}
            toolbar={
              <>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_FILTERS.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setStatusFilter(filter.value)}
                      className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                        statusFilter === filter.value ? 'bg-ink text-white' : 'border border-line text-muted hover:text-ink'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <div className="relative min-w-[160px] flex-1">
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="토큰 검색"
                    className="h-9 w-full border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-ink"
                >
                  {allSelected ? '선택 해제' : '전체 선택'}
                </button>
                <button
                  type="button"
                  onClick={() => setPrintIds(Array.from(selectedIds))}
                  disabled={selectedIds.size === 0}
                  className="flex items-center gap-1.5 bg-primary px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  인쇄 목록 보기 ({selectedIds.size})
                </button>
              </>
            }
          />

          {printIds && (
            <div className="mt-4 border border-line bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-ink">인쇄 미리보기 · {printTags.length}개</div>
                  <div className="mt-0.5 text-xs text-muted">행사명+QR만 인쇄됩니다. 개인 이름은 표시되지 않습니다.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPrintIds(null)}
                  className="text-xs font-semibold text-muted transition-colors hover:text-ink"
                >
                  닫기
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {printTags.map((tag) => (
                  <PrintPreviewCard key={tag.id} exhibitionTitle={exhibition.data?.title ?? ''} token={tag.token} />
                ))}
              </div>
            </div>
          )}
        </div>

        {isCreatePanelOpen && exhibitionId !== null && (
          <BatchCreatePanel
            exhibitionId={exhibitionId}
            onClose={() => setIsCreatePanelOpen(false)}
            onCreated={(createdIds) => {
              setStatusFilter('ALL')
              setSearchTerm('')
              setSelectedIds(new Set(createdIds))
              setPrintIds(createdIds)
            }}
          />
        )}
      </div>
    </div>
  )
}
