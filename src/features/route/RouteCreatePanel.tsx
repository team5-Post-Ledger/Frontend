import { useState } from 'react'
import { Field, fieldControlClass } from '../../components/Field'
import type { Booth } from '../../types'
import { useCreateRecommendedRoute } from './hooks'

const MIN_MINUTES = 30
const MAX_MINUTES = 240
const START_GATE_OPTIONS = ['A', 'B', 'C']

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function Spinner() {
  return <span className="h-4 w-4 shrink-0 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />
}

// 혼잡도 허브(ExhibitionCongestionPage)의 "AI 동선" 탭과 기존 /my/route 양쪽에서 쓸 수 있게
// 분리한 생성 폼(task-map-fix/spec.md §6). onClose가 없으면(허브 탭 임베딩) 닫기 버튼을 안 그린다.
export function RouteCreatePanel({
  exhibitionId,
  exhibitionTitle,
  mustVisitOptions,
  onCreated,
  onClose,
}: {
  exhibitionId: number | null
  exhibitionTitle?: string
  mustVisitOptions: Booth[]
  onCreated: (routeId: number) => void
  onClose?: () => void
}) {
  const [interestText, setInterestText] = useState('')
  const [availableMinutes, setAvailableMinutes] = useState(90)
  const [mustVisitIds, setMustVisitIds] = useState<number[]>([])
  const [startGate, setStartGate] = useState(START_GATE_OPTIONS[0])

  const createRoute = useCreateRecommendedRoute()

  function toggleMustVisit(id: number) {
    setMustVisitIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  function handleSubmit() {
    if (exhibitionId === null || !interestText.trim() || createRoute.isPending) return

    createRoute.mutate(
      { exhibitionId, interestText: interestText.trim(), availableMinutes, mustVisitBoothIds: mustVisitIds, startGate },
      {
        onSuccess: (result) => {
          setInterestText('')
          setMustVisitIds([])
          onCreated(result.routeId)
        },
      },
    )
  }

  return (
    <div className="border border-line bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <div className="text-base font-bold text-ink">새 동선 만들기</div>
          {exhibitionTitle && <p className="mt-0.5 text-xs text-muted">{exhibitionTitle} 기준으로 추천합니다.</p>}
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="shrink-0 text-xs font-semibold text-muted hover:text-ink lg:hidden">
            목록으로
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <Field label="관심사" id="route-interest" required hint="쉼표로 구분해 자유롭게 입력하세요.">
          <textarea
            id="route-interest"
            rows={2}
            value={interestText}
            onChange={(event) => setInterestText(event.target.value)}
            placeholder="예: AI SaaS, 제조 자동화, 스타트업 투자"
            className={`${fieldControlClass} resize-none`}
          />
        </Field>

        <div>
          <div className="mb-2.5 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-muted">가용 시간</span>
            <span>
              <b className="text-lg font-extrabold text-primary">{availableMinutes}</b>
              <span className="ml-0.5 text-xs text-muted">분</span>
            </span>
          </div>
          <input
            type="range"
            min={MIN_MINUTES}
            max={MAX_MINUTES}
            step={15}
            value={availableMinutes}
            onChange={(event) => setAvailableMinutes(Number(event.target.value))}
            className="w-full accent-primary"
          />
          <div className="mt-1.5 flex justify-between text-[10.5px] text-muted">
            <span>30분</span>
            <span>4시간</span>
          </div>
        </div>

        <Field label="출발 게이트" id="route-start-gate">
          <select
            id="route-start-gate"
            value={startGate}
            onChange={(event) => setStartGate(event.target.value)}
            className={fieldControlClass}
          >
            {START_GATE_OPTIONS.map((gate) => (
              <option key={gate} value={gate}>
                {gate}게이트
              </option>
            ))}
          </select>
        </Field>

        {mustVisitOptions.length > 0 && (
          <div>
            <div className="mb-2.5 text-sm font-semibold text-muted">꼭 갈 부스 (선택)</div>
            <div className="flex max-h-52 flex-col gap-2 overflow-y-auto pr-1">
              {mustVisitOptions.map((booth) => {
                const isOn = mustVisitIds.includes(booth.id)
                return (
                  <button
                    key={booth.id}
                    type="button"
                    onClick={() => toggleMustVisit(booth.id)}
                    className={`flex items-center gap-2.5 border p-2.5 text-left transition-colors ${
                      isOn ? 'border-primary bg-surface' : 'border-line bg-white hover:border-primary/50'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center border ${
                        isOn ? 'border-primary bg-primary text-white' : 'border-line bg-white text-transparent'
                      }`}
                    >
                      <CheckIcon />
                    </span>
                    <span className="flex-1 text-sm font-semibold text-ink">{booth.name}</span>
                    <span className="text-xs text-muted">{booth.floor}F</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {createRoute.isError && <p className="text-xs font-medium text-danger">동선을 만들지 못했습니다. 잠시 후 다시 시도해주세요.</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!interestText.trim() || exhibitionId === null || createRoute.isPending}
          className="flex h-11 w-full items-center justify-center gap-2 bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createRoute.isPending && <Spinner />}
          {createRoute.isPending ? '동선 계산 중...' : '동선 만들기'}
        </button>
      </div>
    </div>
  )
}
