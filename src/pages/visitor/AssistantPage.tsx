import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { fieldControlClass } from '../../components/Field'
import { useAskAssistant } from '../../features/assistant/hooks'
import { useMyReservations } from '../../features/myReservation/hooks'
import type { CitedBooth } from '../../lib/api/assistant'
import { useAssistantStore, type AssistantChatMessage } from '../../stores/assistantStore'

const SUGGESTED_QUESTIONS = ['AI 관련 부스 어디 있어?', '로보틱스 부스 추천해줘', '동선 추천받기']

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

// 동선 생성은 이제 각 박람회의 혼잡도 지도 안 "AI 동선" 탭으로 일원화되어 있다
// (task-map-fix/feature.md §2, §4). 채팅에서 동선 의도를 감지하면(§6.11 suggestsRoute) 여기서
// 직접 동선을 만들지 않고 그 탭으로 유도만 한다.
function RouteRedirectCard({ exhibitionId }: { exhibitionId: number }) {
  return (
    <div className="flex max-w-[88%] items-start gap-2.5">
      <AiAvatar />
      <div className="min-w-0 flex-1 border border-line bg-white p-4">
        <div className="text-sm font-bold text-ink">AI 동선 만들기</div>
        <p className="mt-1 text-xs leading-relaxed text-muted">관심사와 가용 시간을 입력하면 맞춤 동선을 만들어드려요.</p>
        <Link
          to={`/exhibitions/${exhibitionId}/congestion?tab=route`}
          className="mt-3 flex h-11 items-center justify-center gap-1.5 bg-primary px-4 text-xs font-bold text-white transition-colors hover:bg-primary-hover"
        >
          동선 만들기
        </Link>
      </div>
    </div>
  )
}

// 박람회 맥락 선택(task-map-fix/feature.md §4, spec.md §7-3안): 방문자의 예약 목록에서 박람회를
// 골라 대화를 시작한다. 예약이 1건이면 자동으로 확정되므로 이 컴포넌트는 2건 이상일 때만 보인다.
function ExhibitionPickerBubble({
  options,
  onPick,
}: {
  options: { exhibitionId: number; exhibitionTitle: string }[]
  onPick: (exhibitionId: number) => void
}) {
  return (
    <div className="flex max-w-[88%] items-start gap-2.5">
      <AiAvatar />
      <div className="min-w-0 flex-1">
        <div className="border border-line bg-white px-3.5 py-2.5 text-sm leading-relaxed text-ink">
          안녕하세요, 행사 도우미예요. 어떤 박람회가 궁금하세요?
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {options.map((option) => (
            <button
              key={option.exhibitionId}
              type="button"
              onClick={() => onPick(option.exhibitionId)}
              className="border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-primary"
            >
              {option.exhibitionTitle}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AssistantPage() {
  const reservations = useMyReservations()

  // 방문자의 예약에서 유니크 박람회만 뽑는다(같은 박람회를 여러 번 예약했을 수 있음) — 새 데이터
  // 없이 기존 예약 목록만 재사용한다(task-map-fix/spec.md §7-1).
  const reservedExhibitions = useMemo(() => {
    const seen = new Map<number, string>()
    for (const reservation of reservations.data ?? []) {
      if (!seen.has(reservation.exhibitionId)) seen.set(reservation.exhibitionId, reservation.exhibitionTitle)
    }
    return Array.from(seen, ([exhibitionId, exhibitionTitle]) => ({ exhibitionId, exhibitionTitle }))
  }, [reservations.data])

  const [pickedExhibitionId, setPickedExhibitionId] = useState<number | null>(null)
  const exhibitionId =
    pickedExhibitionId ?? (reservedExhibitions.length === 1 ? reservedExhibitions[0].exhibitionId : null)

  // 채팅 상태는 assistantStore(in-memory zustand)에서 가져온다 — /assistant를 벗어났다가
  // 뒤로가기로 돌아와도 store는 그대로 살아있어 화면이 유지된다(새로고침하면 초기화됨).
  const messages = useAssistantStore((state) => state.messages)
  const routeCtaVisible = useAssistantStore((state) => state.routeCtaVisible)
  const appendMessage = useAssistantStore((state) => state.appendMessage)
  const showRouteCta = useAssistantStore((state) => state.showRouteCta)

  // 입력창 초안은 휘발성 UI 상태라 store로 옮기지 않고 로컬 state로 둔다.
  const [draft, setDraft] = useState('')

  const askMutation = useAskAssistant()

  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, routeCtaVisible])

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
          if (result.suggestsRoute) showRouteCta()
        },
        onError: () => {
          appendMessage({ role: 'ai', text: '답변을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.' })
        },
      },
    )
  }

  if (reservations.isLoading) {
    return <p className="p-6 text-sm text-muted">불러오는 중...</p>
  }

  if (reservations.isError) {
    return <p className="p-6 text-sm text-danger">예약 정보를 불러오지 못했습니다.</p>
  }

  if (reservedExhibitions.length === 0) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted">예약한 박람회가 없어 도우미를 시작할 수 없어요. 먼저 박람회를 둘러보고 예약해보세요.</p>
        <Link to="/exhibitions" className="mt-2 inline-block text-sm font-semibold text-primary hover:text-primary-hover">
          박람회 목록으로 →
        </Link>
      </div>
    )
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

        {exhibitionId === null ? (
          <div className="flex flex-col gap-4 px-5 py-5 lg:px-0">
            <ExhibitionPickerBubble options={reservedExhibitions} onPick={setPickedExhibitionId} />
          </div>
        ) : (
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

            {routeCtaVisible && <RouteRedirectCard exhibitionId={exhibitionId} />}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {exhibitionId !== null && (
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
      )}
    </div>
  )
}
