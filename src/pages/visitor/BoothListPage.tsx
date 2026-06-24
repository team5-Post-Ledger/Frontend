import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { BoothCard } from '../../components/BoothCard'
import { fieldControlClass } from '../../components/Field'
import { QueryState } from '../../components/QueryState'
import { useBoothsByExhibition } from '../../features/booth/hooks'
import { useExhibition } from '../../features/exhibition/hooks'

type FloorFilter = 'ALL' | number

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  )
}

export default function BoothListPage() {
  const { id } = useParams<{ id: string }>()
  const exhibitionId = id ? Number(id) : null

  const exhibition = useExhibition(exhibitionId)
  const booths = useBoothsByExhibition(exhibitionId)

  const [searchTerm, setSearchTerm] = useState('')
  const [floorFilter, setFloorFilter] = useState<FloorFilter>('ALL')

  const floors = useMemo(() => {
    const unique = new Set((booths.data ?? []).map((booth) => booth.floor))
    return Array.from(unique).sort((a, b) => a - b)
  }, [booths.data])

  const filtered = useMemo(() => {
    const data = booths.data ?? []
    const term = searchTerm.trim().toLowerCase()

    return data.filter((booth) => {
      if (floorFilter !== 'ALL' && booth.floor !== floorFilter) return false
      if (!term) return true
      const haystack = `${booth.name} ${booth.tags.join(' ')}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [booths.data, searchTerm, floorFilter])

  if (exhibitionId === null) {
    return <p className="p-6 text-sm text-danger">잘못된 박람회 경로입니다.</p>
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="mb-6">
        <Link to={`/exhibitions/${exhibitionId}`} className="text-xs font-semibold text-muted transition-colors hover:text-primary">
          ← {exhibition.data?.title ?? '박람회 상세'}
        </Link>
        <h1 className="mt-1.5 text-xl font-extrabold tracking-tight text-ink lg:text-2xl">부스 목록</h1>
        <p className="mt-1 text-sm text-muted">관심 있는 부스를 검색하고 둘러보세요.</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:w-[280px]">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
            <SearchIcon />
          </span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="부스 이름·태그로 검색"
            className={`${fieldControlClass} pl-9`}
          />
        </div>

        <select
          value={floorFilter}
          onChange={(event) => setFloorFilter(event.target.value === 'ALL' ? 'ALL' : Number(event.target.value))}
          className="h-[42px] border border-line bg-white px-3 text-sm text-ink outline-none focus:border-primary"
        >
          <option value="ALL">층 전체</option>
          {floors.map((floor) => (
            <option key={floor} value={floor}>
              {floor}F
            </option>
          ))}
        </select>
      </div>

      <QueryState
        isLoading={booths.isLoading}
        isError={booths.isError}
        isEmpty={filtered.length === 0}
        emptyMessage="조건에 맞는 부스가 없습니다."
        height={240}
      >
        <p className="mb-3 text-xs text-muted">총 {filtered.length.toLocaleString()}개</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((booth) => (
            <BoothCard key={booth.id} exhibitionId={exhibitionId} booth={booth} />
          ))}
        </div>
      </QueryState>
    </div>
  )
}
