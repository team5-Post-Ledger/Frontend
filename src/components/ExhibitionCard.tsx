import { Link } from 'react-router'
import { getExhibitionDisplayStatus } from '../features/exhibition/displayStatus'
import { formatDateRange } from '../lib/format'
import type { Exhibition } from '../types'

export function ExhibitionCard({ exhibition }: { exhibition: Exhibition }) {
  const status = getExhibitionDisplayStatus(exhibition)

  if (!exhibition.bannerImageUrl) {
    return (
      <>
        <Link
          to={`/exhibitions/${exhibition.id}`}
          className="group flex items-center gap-3 border border-line bg-white p-2.5 transition-colors hover:border-primary active:bg-surface sm:hidden"
        >
          <div className="h-20 w-20 shrink-0 bg-[repeating-linear-gradient(45deg,var(--color-line)_0,var(--color-line)_8px,var(--color-surface)_8px,var(--color-surface)_16px)]" />
          <div className="min-w-0 flex-1">
            <span className={`mb-1 inline-block px-1.5 py-0.5 text-[10px] font-bold ${status.badgeClassName}`}>
              {status.label}
            </span>
            <div className="mb-1 line-clamp-1 text-sm font-bold text-ink">{exhibition.title}</div>
            <div className="line-clamp-2 text-xs leading-relaxed text-muted">
              {formatDateRange(exhibition.startDate, exhibition.endDate)}
              <br />
              {exhibition.venue}
            </div>
          </div>
        </Link>

        <Link
          to={`/exhibitions/${exhibition.id}`}
          className="group hidden border border-line bg-white transition-colors hover:border-primary active:bg-surface sm:block"
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
      </>
    )
  }

  return (
    <>
      <Link
        to={`/exhibitions/${exhibition.id}`}
        className="group flex items-center gap-3 border border-line bg-white p-2.5 transition-colors hover:border-primary active:brightness-95 sm:hidden"
      >
        <div
          className="h-20 w-20 shrink-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${exhibition.bannerImageUrl})` }}
        />
        <div className="min-w-0 flex-1">
          <span className={`mb-1 inline-block px-1.5 py-0.5 text-[10px] font-bold ${status.badgeClassName}`}>
            {status.label}
          </span>
          <div className="mb-1 line-clamp-1 text-sm font-bold text-ink">{exhibition.title}</div>
          <div className="line-clamp-2 text-xs leading-relaxed text-muted">
            {formatDateRange(exhibition.startDate, exhibition.endDate)}
            <br />
            {exhibition.venue}
          </div>
        </div>
      </Link>

      <Link
        to={`/exhibitions/${exhibition.id}`}
        className="group relative hidden h-48 overflow-hidden border border-line bg-white transition-colors hover:border-primary active:brightness-95 sm:block"
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 transition-opacity duration-300 lg:opacity-15 lg:group-hover:opacity-100 lg:group-focus-visible:opacity-100"
          style={{ backgroundImage: `url(${exhibition.bannerImageUrl})` }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-ink/85 via-ink/25 to-transparent" />

        <span className={`absolute left-2.5 top-2.5 px-2.5 py-1 text-[11px] font-bold ${status.badgeClassName}`}>
          {status.label}
        </span>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="mb-2 line-clamp-1 text-sm font-bold text-white">{exhibition.title}</div>
          <div className="text-xs leading-relaxed text-white/80">
            {formatDateRange(exhibition.startDate, exhibition.endDate)}
            <br />
            {exhibition.venue}
          </div>
        </div>
      </Link>
    </>
  )
}
