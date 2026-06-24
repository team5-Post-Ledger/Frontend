import { Link } from 'react-router'
import { getExhibitionDisplayStatus } from '../features/exhibition/displayStatus'
import { formatDateRange } from '../lib/format'
import type { Exhibition } from '../types'

export function ExhibitionCard({ exhibition }: { exhibition: Exhibition }) {
  const status = getExhibitionDisplayStatus(exhibition)

  return (
    <Link
      to={`/exhibitions/${exhibition.id}`}
      className="group block border border-line bg-white transition-colors hover:border-primary"
    >
      <div className="relative h-24 bg-[repeating-linear-gradient(45deg,var(--color-line)_0,var(--color-line)_8px,var(--color-surface)_8px,var(--color-surface)_16px)]">
        <span className={`absolute left-2.5 top-2.5 px-2.5 py-1 text-[11px] font-bold ${status.badgeClassName}`}>
          {status.label}
        </span>
      </div>
      <div className="p-4">
        <div className="mb-2 line-clamp-1 text-sm font-bold text-ink">{exhibition.title}</div>
        <div className="text-xs leading-relaxed text-muted">
          {formatDateRange(exhibition.startDate, exhibition.endDate)}
          <br />
          {exhibition.venue}
        </div>
      </div>
    </Link>
  )
}
