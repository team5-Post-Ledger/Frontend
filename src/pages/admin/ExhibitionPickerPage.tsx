import { useNavigate } from 'react-router'
import { QueryState } from '../../components/QueryState'
import { useMyExhibitions } from '../../features/exhibition/hooks'
import { formatDateRange } from '../../lib/format'
import { useCurrentExhibitionStore } from '../../stores/currentExhibitionStore'
import type { Exhibition, ExhibitionStatus } from '../../types'

const STATUS_LABEL: Record<ExhibitionStatus, string> = {
  DRAFT: '준비중',
  OPEN: '진행중',
  CLOSED: '종료',
}

const STATUS_BADGE_CLASS: Record<ExhibitionStatus, string> = {
  DRAFT: 'bg-warning text-white',
  OPEN: 'bg-live text-ink',
  CLOSED: 'bg-line text-muted',
}

function ExhibitionPickerCard({
  exhibition,
  selected,
  onSelect,
}: {
  exhibition: Exhibition
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col gap-3 border p-5 text-left transition-colors ${
        selected ? 'border-primary bg-primary/5' : 'border-line bg-white hover:border-primary'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`px-2.5 py-1 text-[11px] font-bold ${STATUS_BADGE_CLASS[exhibition.status]}`}>
          {STATUS_LABEL[exhibition.status]}
        </span>
        {selected && <span className="bg-primary px-2 py-0.5 text-[10px] font-bold text-white">선택됨</span>}
      </div>
      <div>
        <div className="text-base font-bold text-ink">{exhibition.title}</div>
        <div className="mt-1.5 text-xs text-muted">{exhibition.venue}</div>
        <div className="mt-0.5 text-xs text-muted">{formatDateRange(exhibition.startDate, exhibition.endDate)}</div>
      </div>
    </button>
  )
}

export default function ExhibitionPickerPage() {
  const navigate = useNavigate()
  const exhibitions = useMyExhibitions()
  const exhibitionId = useCurrentExhibitionStore((state) => state.exhibitionId)
  const setExhibitionId = useCurrentExhibitionStore((state) => state.setExhibitionId)

  function handleSelect(id: number) {
    setExhibitionId(id)
    navigate(`/admin/exhibitions/${id}`)
  }

  const data = exhibitions.data ?? []

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">담당 행사 선택</h1>
        <p className="mt-1 text-sm text-muted">담당 행사를 선택하면 그 행사를 기준으로 운영 화면이 열립니다.</p>
      </div>

      <QueryState isLoading={exhibitions.isLoading} isError={exhibitions.isError} isEmpty={data.length === 0} emptyMessage="배정된 행사가 없습니다.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((exhibition) => (
            <ExhibitionPickerCard
              key={exhibition.id}
              exhibition={exhibition}
              selected={exhibition.id === exhibitionId}
              onSelect={() => handleSelect(exhibition.id)}
            />
          ))}
        </div>
      </QueryState>
    </div>
  )
}
