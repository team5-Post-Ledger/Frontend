import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { QueryState } from '../../components/QueryState'
import { useEducationGuidePublic, useSubmitQuiz } from '../../features/education/hooks'
import { useAuthStore } from '../../stores/authStore'
import type { EducationTargetRole, QuizQuestionPublic } from '../../types'
import type { QuizSubmitResult } from '../../lib/api/education'

function resolveRole(role: string | undefined): EducationTargetRole {
  return role === 'EXHIBITOR' ? 'EXHIBITOR' : 'STAFF'
}

function QuizQuestion({
  index,
  question,
  selected,
  onSelect,
  disabled,
}: {
  index: number
  question: QuizQuestionPublic
  selected: number | null
  onSelect: (optionIndex: number) => void
  disabled: boolean
}) {
  return (
    <div className="border-b border-line px-5 py-5 last:border-b-0">
      <p className="mb-3 text-sm font-bold text-ink">
        Q{index + 1}. {question.q}
      </p>
      <div className="flex flex-col gap-2">
        {question.options.map((opt, optIndex) => {
          const checked = selected === optIndex
          return (
            <label
              key={optIndex}
              className={`flex cursor-pointer items-center gap-3 border px-4 py-3 transition-colors ${
                checked ? 'border-primary bg-primary/5' : 'border-line bg-white hover:border-primary/40'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input
                type="radio"
                name={`q-${index}`}
                value={optIndex}
                checked={checked}
                onChange={() => !disabled && onSelect(optIndex)}
                disabled={disabled}
                className="accent-primary"
              />
              <span className="text-sm text-ink">{opt}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

function QuizResult({
  result,
  guideId,
  onRetry,
}: {
  result: QuizSubmitResult
  guideId: number
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className={`border p-5 ${result.quizPassed ? 'border-success/40 bg-success/10' : 'border-danger/30 bg-danger/5'}`}>
        <div className="flex items-center gap-3">
          <span className={`text-3xl font-extrabold tracking-tight ${result.quizPassed ? 'text-success' : 'text-danger'}`}>
            {result.score}점
          </span>
          <span className={`px-2 py-0.5 text-xs font-bold ${result.quizPassed ? 'bg-success/20 text-success' : 'bg-danger/10 text-danger'}`}>
            {result.quizPassed ? '합격' : '불합격'}
          </span>
          {result.completed && (
            <span className="bg-success/15 px-2 py-0.5 text-xs font-bold text-success">이수 완료</span>
          )}
        </div>
        {result.message && (
          <p className="mt-2 text-sm leading-relaxed text-ink">{result.message}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {!result.quizPassed && (
          <button
            type="button"
            onClick={onRetry}
            className="flex h-11 items-center justify-center bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
          >
            다시 응시
          </button>
        )}
        <Link
          to={`/education/${guideId}`}
          className="flex h-11 items-center justify-center border border-line bg-white px-6 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
        >
          상세로 돌아가기
        </Link>
        {result.completed && (
          <Link
            to="/education/progress"
            className="flex h-11 items-center justify-center px-6 text-sm font-semibold text-primary underline underline-offset-2 transition-colors hover:text-primary-hover"
          >
            자격 현황 보기 →
          </Link>
        )}
      </div>
    </div>
  )
}

export default function QuizPage() {
  const { id } = useParams<{ id: string }>()
  const guideId = id && !Number.isNaN(Number(id)) ? Number(id) : null

  const userRole = useAuthStore((s) => s.user?.role)
  const targetRole = resolveRole(userRole)

  const query = useEducationGuidePublic(guideId)
  const guide = query.data ?? null
  const questions = guide?.quizQuestions ?? null

  const submitMutation = useSubmitQuiz(targetRole)

  // selections: { [questionIndex]: selectedOptionIndex }
  const [selections, setSelections] = useState<Record<number, number>>({})
  const [result, setResult] = useState<QuizSubmitResult | null>(null)

  const totalQuestions = questions?.length ?? 0
  const allAnswered = totalQuestions > 0 && Object.keys(selections).length === totalQuestions

  function handleSelect(questionIndex: number, optionIndex: number) {
    setSelections((prev) => ({ ...prev, [questionIndex]: optionIndex }))
  }

  function handleSubmit() {
    if (!guideId || !allAnswered) return
    const answers = Object.entries(selections).map(([qi, oi]) => ({
      questionIndex: Number(qi),
      selectedOptionIndex: oi,
    }))
    submitMutation.mutate(
      { guideId, answers },
      {
        onSuccess: (data) => setResult(data),
      },
    )
  }

  function handleRetry() {
    setSelections({})
    setResult(null)
    submitMutation.reset()
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Link to={`/education/${id}`} className="text-xs font-semibold text-muted transition-colors hover:text-ink">
        ← 상세로 돌아가기
      </Link>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={!query.isLoading && guide === null}
        emptyMessage="가이드를 찾을 수 없습니다."
        height={200}
      >
        {guide && (
          <>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{guide.category}</span>
              <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-ink">{guide.title} — 퀴즈</h1>
              {guide.quizPassScore !== null && (
                <p className="mt-1 text-sm text-muted">합격 기준 {guide.quizPassScore}점 · {totalQuestions}문항</p>
              )}
            </div>

            {result ? (
              <QuizResult result={result} guideId={guide.id} onRetry={handleRetry} />
            ) : (
              <>
                <div className="border border-line bg-white">
                  {questions?.map((q, index) => (
                    <QuizQuestion
                      key={index}
                      index={index}
                      question={q}
                      selected={selections[index] ?? null}
                      onSelect={(optIdx) => handleSelect(index, optIdx)}
                      disabled={submitMutation.isPending}
                    />
                  ))}
                </div>

                {submitMutation.isError && (
                  <p className="text-sm font-medium text-danger">{submitMutation.error?.message}</p>
                )}

                <button
                  type="button"
                  disabled={!allAnswered || submitMutation.isPending}
                  onClick={handleSubmit}
                  className="flex h-11 items-center justify-center gap-2 bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitMutation.isPending && (
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />
                  )}
                  {!allAnswered ? `${totalQuestions - Object.keys(selections).length}문항 남음` : '제출'}
                </button>
              </>
            )}
          </>
        )}
      </QueryState>
    </div>
  )
}
