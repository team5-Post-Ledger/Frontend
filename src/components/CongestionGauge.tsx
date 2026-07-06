import { CONGESTION_LEVEL_LABEL, type CongestionPointLevel } from '../features/congestion/api'

const LEVELS: CongestionPointLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'FULL']

const LEVEL_TEXT_CLASS: Record<CongestionPointLevel, string> = {
  LOW: 'text-success',
  MEDIUM: 'text-warning',
  HIGH: 'text-danger',
  FULL: 'text-danger',
}

// HIGH/FULL은 지도 범례("혼잡·포화")와 동일하게 danger를 공유한다 — 토큰에 danger보다 진한
// 경고색이 없어 색으로는 구분하지 않고, 활성 칸 수(3칸 vs 4칸)와 라벨로 구분한다.
const LEVEL_BAR_CLASS: Record<CongestionPointLevel, string> = {
  LOW: 'bg-success',
  MEDIUM: 'bg-warning',
  HIGH: 'bg-danger',
  FULL: 'bg-danger',
}

export function CongestionGauge({ level }: { level: CongestionPointLevel }) {
  const activeIndex = LEVELS.indexOf(level)

  return (
    <div>
      <div className={`text-2xl font-extrabold leading-none ${LEVEL_TEXT_CLASS[level]}`}>
        {CONGESTION_LEVEL_LABEL[level]}
      </div>
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
          <span key={label}>{CONGESTION_LEVEL_LABEL[label]}</span>
        ))}
      </div>
    </div>
  )
}
