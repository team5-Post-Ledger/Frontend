import type { DatePresetMode } from '../features/exhibition/dateRange'
import { QUICK_DATE_PRESETS, QUICK_VENUE_PRESETS } from '../features/exhibition/filterConstants'

const pillClass = (active: boolean) =>
  `shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
    active ? 'border-primary bg-primary text-white' : 'border-line bg-white text-muted hover:text-ink'
  }`

export function QuickFilterPills({
  dateMode,
  venue,
  onSelectDatePreset,
  onSelectVenue,
  panelOpen,
  onTogglePanel,
  className = '',
}: {
  dateMode: DatePresetMode | ''
  venue: string
  onSelectDatePreset: (mode: Exclude<DatePresetMode, 'custom'>) => void
  onSelectVenue: (venue: string) => void
  panelOpen: boolean
  onTogglePanel: () => void
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2 overflow-x-auto pt-3 ${className}`}>
      {QUICK_DATE_PRESETS.map((preset) => (
        <button
          key={preset.mode}
          type="button"
          onClick={() => onSelectDatePreset(preset.mode)}
          aria-pressed={dateMode === preset.mode}
          className={pillClass(dateMode === preset.mode)}
        >
          {preset.label}
        </button>
      ))}
      {QUICK_VENUE_PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => onSelectVenue(preset)}
          aria-pressed={venue === preset}
          className={pillClass(venue === preset)}
        >
          {preset}
        </button>
      ))}
      <button
        type="button"
        onClick={onTogglePanel}
        aria-expanded={panelOpen}
        className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
          panelOpen ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:border-primary'
        }`}
      >
        상세필터 <span aria-hidden="true">{panelOpen ? '▴' : '▾'}</span>
      </button>
    </div>
  )
}
