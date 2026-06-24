import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { fieldControlClass } from '../../components/Field'
import { useBoothCategories, useBoothsByExhibition } from '../../features/booth/hooks'
import { useCurrentExhibition } from '../../features/exhibition/hooks'
import { useAskAssistant, useMockRouteSuggestion } from '../../features/assistant/hooks'
import type { CitedBooth, RouteSuggestionResult } from '../../lib/api/assistant'
import { useAssistantStore, type AssistantChatMessage } from '../../stores/assistantStore'
import type { Booth, BoothCategory } from '../../types'

const SUGGESTED_QUESTIONS = ['AI 관련 부스 어디 있어?', '로보틱스 부스 추천해줘', '동선 추천받기']
const MIN_MINUTES = 30
const MAX_MINUTES = 240
const MUST_VISIT_OPTION_COUNT = 4

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  )
}

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

function AiAvatar() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-primary text-white">
      <SparkleIcon />
    </div>
  )
}

function CitedBoothChip({ exhibitionId, booth }: { exhibitionId: number; booth: CitedBooth }) {
  return (
    <Link
      to={`/exhibitions/${exhibitionId}/booths/${booth.boothId}`}
      className="flex items-center gap-1.5 border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-primary"
    >
      <LocationIcon />
      {booth.name}
      <span className="text-muted">· {booth.floor}F</span>
    </Link>
  )
}

function ChatBubble({ message, exhibitionId }: { message: AssistantChatMessage; exhibitionId: number }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-primary px-3.5 py-2.5 text-sm font-medium text-white">{message.text}</div>
      </div>
    )
  }

  return (
    <div className="flex max-w-[88%] items-start gap-2.5">
      <AiAvatar />
      <div className="min-w-0 flex-1">
        <div className="border border-line bg-white px-3.5 py-2.5 text-sm leading-relaxed text-ink">{message.text}</div>
        {message.citedBooths && message.citedBooths.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.citedBooths.map((booth) => (
              <CitedBoothChip key={booth.boothId} exhibitionId={exhibitionId} booth={booth} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RouteForm({
  minutes,
  onMinutesChange,
  categories,
  selectedCategoryIds,
  onToggleCategory,
  mustVisitOptions,
  mustVisitIds,
  onToggleMustVisit,
  isLoading,
  isDone,
  onGenerate,
}: {
  minutes: number
  onMinutesChange: (value: number) => void
  categories: BoothCategory[]
  selectedCategoryIds: number[]
  onToggleCategory: (id: number) => void
  mustVisitOptions: Booth[]
  mustVisitIds: number[]
  onToggleMustVisit: (id: number) => void
  isLoading: boolean
  isDone: boolean
  onGenerate: () => void
}) {
  return (
    <div className="flex max-w-[92%] items-start gap-2.5">
      <AiAvatar />
      <div className="min-w-0 flex-1 border border-line bg-white p-4">
        <p className="mb-4 text-sm leading-relaxed text-ink">동선을 추천해드릴게요. 아래 조건만 확인해 주세요.</p>

        <div className="mb-4">
          <div className="mb-2.5 flex items-baseline justify-between">
            <span className="text-xs font-bold text-muted">가용 시간</span>
            <span>
              <b className="text-lg font-extrabold text-primary">{minutes}</b>
              <span className="ml-0.5 text-xs text-muted">분</span>
            </span>
          </div>
          <input
            type="range"
            min={MIN_MINUTES}
            max={MAX_MINUTES}
            step={15}
            value={minutes}
            onChange={(event) => onMinutesChange(Number(event.target.value))}
            className="w-full accent-primary"
          />
          <div className="mt-1.5 flex justify-between text-[10.5px] text-muted">
            <span>30분</span>
            <span>4시간</span>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="mb-4">
            <div className="mb-2.5 text-xs font-bold text-muted">관심 카테고리</div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((category) => {
                const isOn = selectedCategoryIds.includes(category.id)
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onToggleCategory(category.id)}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isOn ? 'bg-primary text-white' : 'border border-line text-muted hover:text-ink'
                    }`}
                  >
                    {category.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {mustVisitOptions.length > 0 && (
          <div className="mb-4">
            <div className="mb-2.5 text-xs font-bold text-muted">꼭 갈 부스</div>
            <div className="flex flex-col gap-2">
              {mustVisitOptions.map((booth) => {
                const isOn = mustVisitIds.includes(booth.id)
                return (
                  <button
                    key={booth.id}
                    type="button"
                    onClick={() => onToggleMustVisit(booth.id)}
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

        <button
          type="button"
          onClick={onGenerate}
          disabled={isLoading}
          className="flex h-11 w-full items-center justify-center gap-2 bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-default disabled:opacity-60"
        >
          {isLoading && <Spinner />}
          {isLoading ? '동선 계산 중...' : isDone ? '조건 바꿔 다시 만들기' : '동선 만들기'}
        </button>
      </div>
    </div>
  )
}

function RouteResultCard({
  exhibitionId,
  result,
  saved,
  onSave,
}: {
  exhibitionId: number
  result: RouteSuggestionResult
  saved: boolean
  onSave: () => void
}) {
  return (
    <div className="flex max-w-[92%] items-start gap-2.5">
      <AiAvatar />
      <div className="min-w-0 flex-1 border border-line bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
          <div>
            <div className="text-sm font-bold text-ink">추천 방문 동선</div>
            <div className="mt-0.5 text-xs text-muted">관심사·시간을 반영한 추천 순서예요</div>
          </div>
          <div className="shrink-0 text-right">
            <div>
              <span className="text-lg font-extrabold text-primary">{result.totalEstMinutes}</span>
              <span className="ml-0.5 text-xs text-muted">분</span>
            </div>
            <div className="text-xs text-muted">부스 {result.stops.length}곳</div>
          </div>
        </div>

        <div className="flex flex-col p-4">
          {result.stops.map((stop, index) => (
            <div key={stop.visitOrder} className="flex gap-3">
              <div className="flex shrink-0 flex-col items-center">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-primary text-xs font-bold text-white">
                  {stop.visitOrder}
                </span>
                {index < result.stops.length - 1 && <span className="mt-1 w-px flex-1 bg-line" />}
              </div>
              <Link
                to={`/exhibitions/${exhibitionId}/booths/${stop.boothId}`}
                className="mb-3 flex-1 border border-line p-3 transition-colors hover:border-primary"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-bold text-ink">{stop.boothName}</span>
                  <span className="shrink-0 bg-surface px-2 py-0.5 text-[11px] font-bold text-primary">{stop.estMinutes}분</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                  <LocationIcon />
                  {stop.floor}F · ({stop.posX}, {stop.posY})
                </div>
                <p className="mt-1.5 border-t border-line pt-1.5 text-xs leading-relaxed text-muted">{stop.reason}</p>
              </Link>
            </div>
          ))}
        </div>

        <div className="flex gap-2 border-t border-line p-3">
          <button
            type="button"
            onClick={onSave}
            className={`flex h-11 flex-1 items-center justify-center gap-1.5 border text-xs font-bold transition-colors ${
              saved ? 'border-primary bg-surface text-primary' : 'border-line text-muted hover:border-primary hover:text-primary'
            }`}
          >
            {saved ? '저장됨' : '내 동선으로 저장'}
          </button>
          {/* TODO(§10.1 /my/route 연동 지점): 동선 상세는 §6.10 GET /api/recommendations/{id}로 조회한다. 지금은 스텁 이동만 한다. */}
          <Link
            to="/my/route"
            className="flex h-11 flex-1 items-center justify-center gap-1.5 bg-primary text-xs font-bold text-white transition-colors hover:bg-primary-hover"
          >
            내 동선 보기
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AssistantPage() {
  const exhibition = useCurrentExhibition()
  const exhibitionId = exhibition.data?.id ?? null

  const categories = useBoothCategories()
  const booths = useBoothsByExhibition(exhibitionId)

  const exhibitionCategories = useMemo(
    () => (categories.data ?? []).filter((category) => category.exhibitionId === exhibitionId),
    [categories.data, exhibitionId],
  )
  const mustVisitOptions = useMemo(() => (booths.data ?? []).slice(0, MUST_VISIT_OPTION_COUNT), [booths.data])

  // 채팅/동선 상태는 assistantStore(in-memory zustand)에서 가져온다 — /assistant를 벗어났다가
  // 뒤로가기로 돌아와도 store는 그대로 살아있어 화면이 유지된다(새로고침하면 초기화됨).
  const messages = useAssistantStore((state) => state.messages)
  const routeStage = useAssistantStore((state) => state.routeStage)
  const minutes = useAssistantStore((state) => state.minutes)
  const selectedCategoryIds = useAssistantStore((state) => state.selectedCategoryIds)
  const mustVisitIds = useAssistantStore((state) => state.mustVisitIds)
  const routeResult = useAssistantStore((state) => state.routeResult)
  const routeSaved = useAssistantStore((state) => state.routeSaved)

  const appendMessage = useAssistantStore((state) => state.appendMessage)
  const setRouteStage = useAssistantStore((state) => state.setRouteStage)
  const setMinutes = useAssistantStore((state) => state.setMinutes)
  const toggleCategory = useAssistantStore((state) => state.toggleCategory)
  const toggleMustVisit = useAssistantStore((state) => state.toggleMustVisit)
  const applyRouteResult = useAssistantStore((state) => state.applyRouteResult)
  const toggleRouteSaved = useAssistantStore((state) => state.toggleRouteSaved)

  // 입력창 초안은 휘발성 UI 상태라 store로 옮기지 않고 로컬 state로 둔다.
  const [draft, setDraft] = useState('')

  const askMutation = useAskAssistant()
  const routeMutation = useMockRouteSuggestion()

  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, routeStage, routeResult])

  function handleAsk(rawText?: string) {
    const text = (rawText ?? draft).trim()
    if (!text || exhibitionId === null || askMutation.isPending) return

    setDraft('')
    appendMessage({ role: 'user', text })

    askMutation.mutate(
      { exhibitionId, question: text },
      {
        onSuccess: (result) => {
          appendMessage({ role: 'ai', text: result.answer, citedBooths: result.citedBooths })
          if (result.suggestsRoute) setRouteStage('form')
        },
        onError: () => {
          appendMessage({ role: 'ai', text: '답변을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.' })
        },
      },
    )
  }

  function handleGenerateRoute() {
    if (exhibitionId === null) return
    routeMutation.mutate(
      { exhibitionId, mustVisitBoothIds: mustVisitIds },
      {
        onSuccess: (result) => {
          applyRouteResult(result)
        },
      },
    )
  }

  function handleSaveRoute() {
    // TODO(§6.10 연동 지점): 실제로는 POST /api/recommendations/route 응답의 routeId를 저장하고
    // GET /api/recommendations/me로 /my/route 목록에 노출한다. 지금은 로컬 상태만 토글한다.
    toggleRouteSaved()
  }

  if (exhibition.isLoading) {
    return <p className="p-6 text-sm text-muted">불러오는 중...</p>
  }

  if (exhibition.isError || exhibitionId === null) {
    return <p className="p-6 text-sm text-danger">행사 정보를 불러오지 못했습니다.</p>
  }

  return (
    <div className="flex flex-col">
      <div className="mx-auto w-full lg:max-w-2xl">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4 lg:px-0">
          <AiAvatar />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-ink">행사 도우미</div>
            <div className="text-xs text-muted">무엇이든 물어보세요 · 부스와 동선을 안내해요</div>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 bg-surface px-2.5 py-1 text-[11px] font-bold text-ink">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-live" />
            온라인
          </span>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5 pb-40 lg:px-0 lg:pb-32">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} exhibitionId={exhibitionId} />
          ))}

          {askMutation.isPending && (
            <div className="flex items-center gap-2.5">
              <AiAvatar />
              <span className="text-xs text-muted">답변 작성 중...</span>
            </div>
          )}

          {routeStage !== 'hidden' && (
            <RouteForm
              minutes={minutes}
              onMinutesChange={setMinutes}
              categories={exhibitionCategories}
              selectedCategoryIds={selectedCategoryIds}
              onToggleCategory={toggleCategory}
              mustVisitOptions={mustVisitOptions}
              mustVisitIds={mustVisitIds}
              onToggleMustVisit={toggleMustVisit}
              isLoading={routeMutation.isPending}
              isDone={routeStage === 'done'}
              onGenerate={handleGenerateRoute}
            />
          )}

          {routeStage === 'done' && routeResult && (
            <RouteResultCard exhibitionId={exhibitionId} result={routeResult} saved={routeSaved} onSave={handleSaveRoute} />
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-line bg-white lg:bottom-0">
        <div className="mx-auto flex w-full flex-col gap-2 px-4 py-3 lg:max-w-2xl">
          <div className="flex gap-2 overflow-x-auto">
            {SUGGESTED_QUESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                disabled={askMutation.isPending}
                onClick={() => handleAsk(question)}
                className="shrink-0 whitespace-nowrap border border-line px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                {question}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleAsk()
              }}
              placeholder="궁금한 점을 입력하세요"
              className={`${fieldControlClass} flex-1`}
            />
            <button
              type="button"
              onClick={() => handleAsk()}
              disabled={!draft.trim() || askMutation.isPending}
              aria-label="전송"
              className="flex h-11 w-11 shrink-0 items-center justify-center bg-primary text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
