import type { CongestionLevel } from '../features/congestion/api'

const LEVELS: CongestionLevel[] = ['여유', '보통', '혼잡']

const LEVEL_TEXT_CLASS: Record<CongestionLevel, string> = {
  여유: 'text-success',
  보통: 'text-warning',
  혼잡: 'text-danger',
}

const LEVEL_BAR_CLASS: Record<CongestionLevel, string> = {
  여유: 'bg-success',
  보통: 'bg-warning',
  혼잡: 'bg-danger',
}

export function CongestionGauge({ level }: { level: CongestionLevel }) {
  const activeIndex = LEVELS.indexOf(level)

  return (
    <div>
      <div className={`text-2xl font-extrabold leading-none ${LEVEL_TEXT_CLASS[level]}`}>{level}</div>
      <div className="mt-4 flex gap-1.5">
        {LEVELS.map((label, index) => (
          <div
            key={label}
            className={`h-1.5 flex-1 rounded-full ${index <= activeIndex ? LEVEL_BAR_CLASS[label] : 'bg-line'}`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10.5px] text-muted">
        {LEVELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  )
}
