import { Link } from 'react-router'
import type { Booth } from '../types'

export function BoothCard({ exhibitionId, booth }: { exhibitionId: number; booth: Booth }) {
  return (
    <Link
      to={`/exhibitions/${exhibitionId}/booths/${booth.id}`}
      className="block border border-line bg-white transition-colors hover:border-primary"
    >
      <div className="h-24 bg-[repeating-linear-gradient(45deg,var(--color-line)_0,var(--color-line)_8px,var(--color-surface)_8px,var(--color-surface)_16px)]" />
      <div className="p-4">
        <div className="mb-1.5 line-clamp-1 text-sm font-bold text-ink">{booth.name}</div>
        <div className="mb-2 text-xs text-muted">
          {booth.floor}F · ({booth.posX}, {booth.posY})
        </div>
        <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-muted">{booth.description}</p>
        {booth.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {booth.tags.map((tag) => (
              <span key={tag} className="bg-surface px-1.5 py-0.5 text-[10.5px] text-muted">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
