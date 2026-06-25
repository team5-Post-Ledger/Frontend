import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Field, fieldControlClass } from '../../components/Field'
import { useCreateEducationGuide, useEducationGuide, useUpdateEducationGuide } from '../../features/education/hooks'
import type { EducationGuideInput } from '../../lib/api/education'
import type { EducationGuide } from '../../types'

interface QuizQuestionFormState {
  q: string
  options: string[]
  answer: number
}

interface EducationGuideFormState {
  title: string
  content: string
  videoUrl: string
  isRequired: boolean
  quizQuestions: QuizQuestionFormState[]
  quizPassScore: string
}

interface EducationGuideFormErrors {
  title?: string
  content?: string
  quizQuestions?: string
  quizPassScore?: string
}

function blankFormState(): EducationGuideFormState {
  return { title: '', content: '', videoUrl: '', isRequired: false, quizQuestions: [], quizPassScore: '' }
}

function guideToFormState(guide: EducationGuide): EducationGuideFormState {
  return {
    title: guide.title,
    content: guide.content,
    videoUrl: guide.videoUrl ?? '',
    isRequired: guide.isRequired,
    // 이 admin 편집 화면은 작성자(EXPO_ADMIN)용이라 answer(정답)를 그대로 불러와 보여준다.
    // §3 285행: STAFF 퀴즈 응시 조회 응답에서는 answer를 반드시 제외해야 한다(EducationGuidePublic 사용,
    // 서버 채점만 허용) — 이 화면의 값을 그대로 STAFF 쪽 응답에 흘려보내면 안 된다.
    quizQuestions: (guide.quizQuestions ?? []).map((question) => ({ q: question.q, options: [...question.options], answer: question.answer })),
    quizPassScore: guide.quizPassScore !== null ? String(guide.quizPassScore) : '',
  }
}

function BackIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function CompletionRuleNotice() {
  return (
    <div className="flex flex-col gap-3 border border-line bg-surface p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-ink">이수 판정 규칙</div>
      <ul className="flex flex-col gap-2 text-xs leading-relaxed text-muted">
        <li>· 텍스트만 있는 가이드(영상 X·퀴즈 X) — 확인 완료 시 바로 수료 처리됩니다.</li>
        <li>· 영상이 있는 가이드 — 영상 시청 완료가 수료의 필수 조건입니다. 시청을 마치지 않으면 수료될 수 없습니다.</li>
        <li>· 영상+퀴즈 가이드 — 영상 시청 완료와 퀴즈 통과를 모두 만족해야 수료 처리됩니다.</li>
      </ul>
    </div>
  )
}

function EducationGuideEditor({ guide, isNew, onSaved }: { guide: EducationGuide | null; isNew: boolean; onSaved: () => void }) {
  const [form, setForm] = useState<EducationGuideFormState>(() => (guide ? guideToFormState(guide) : blankFormState()))
  const [errors, setErrors] = useState<EducationGuideFormErrors>({})

  const createMutation = useCreateEducationGuide()
  const updateMutation = useUpdateEducationGuide()
  const isSaving = createMutation.isPending || updateMutation.isPending

  function updateForm(patch: Partial<EducationGuideFormState>) {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  function updateQuestion(index: number, patch: Partial<QuizQuestionFormState>) {
    updateForm({ quizQuestions: form.quizQuestions.map((question, i) => (i === index ? { ...question, ...patch } : question)) })
  }

  function addQuestion() {
    updateForm({ quizQuestions: [...form.quizQuestions, { q: '', options: ['', ''], answer: 0 }] })
  }

  function removeQuestion(index: number) {
    const nextQuestions = form.quizQuestions.filter((_, i) => i !== index)
    updateForm({ quizQuestions: nextQuestions, quizPassScore: nextQuestions.length === 0 ? '' : form.quizPassScore })
  }

  function addOption(qIndex: number) {
    updateQuestion(qIndex, { options: [...form.quizQuestions[qIndex].options, ''] })
  }

  function removeOption(qIndex: number, oIndex: number) {
    const question = form.quizQuestions[qIndex]
    const nextOptions = question.options.filter((_, i) => i !== oIndex)
    const nextAnswer = question.answer === oIndex ? 0 : question.answer > oIndex ? question.answer - 1 : question.answer
    updateQuestion(qIndex, { options: nextOptions, answer: nextAnswer })
  }

  function updateOptionText(qIndex: number, oIndex: number, value: string) {
    const question = form.quizQuestions[qIndex]
    updateQuestion(qIndex, { options: question.options.map((option, i) => (i === oIndex ? value : option)) })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: EducationGuideFormErrors = {}
    if (!form.title.trim()) nextErrors.title = '제목을 입력해주세요.'
    if (!form.content.trim()) nextErrors.content = '가이드 본문을 입력해주세요.'

    const hasQuiz = form.quizQuestions.length > 0
    if (hasQuiz) {
      const hasInvalidQuestion = form.quizQuestions.some(
        (question) => !question.q.trim() || question.options.length < 2 || question.options.some((option) => !option.trim()),
      )
      if (hasInvalidQuestion) nextErrors.quizQuestions = '모든 문항에 질문과 보기 2개 이상을 입력해주세요.'

      const score = Number(form.quizPassScore)
      if (form.quizPassScore.trim() === '' || Number.isNaN(score) || score < 0 || score > 100) {
        nextErrors.quizPassScore = '0~100 사이의 점수를 입력해주세요.'
      }
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const input: EducationGuideInput = {
      exhibitionId: guide?.exhibitionId ?? null,
      targetRole: guide?.targetRole ?? 'STAFF',
      category: guide?.category ?? '',
      title: form.title.trim(),
      content: form.content.trim(),
      videoUrl: form.videoUrl.trim() || null,
      isRequired: form.isRequired,
      sortOrder: guide?.sortOrder ?? 0,
      quizQuestions: hasQuiz
        ? form.quizQuestions.map((question) => ({
            q: question.q.trim(),
            options: question.options.map((option) => option.trim()),
            answer: question.answer,
          }))
        : null,
      quizPassScore: hasQuiz ? Number(form.quizPassScore) : null,
      status: guide?.status ?? 'ACTIVE',
    }

    if (isNew) {
      createMutation.mutate(input, { onSuccess: onSaved })
    } else if (guide) {
      updateMutation.mutate({ id: guide.id, input }, { onSuccess: onSaved })
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px] lg:items-start">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="제목" id="guide-title" required error={errors.title}>
          <input
            id="guide-title"
            value={form.title}
            onChange={(event) => updateForm({ title: event.target.value })}
            placeholder="예: 행사장 출입 및 안전 수칙"
            className={fieldControlClass}
          />
        </Field>

        <Field label="본문" id="guide-content" required error={errors.content} hint="텍스트 가이드 본문입니다.">
          <textarea
            id="guide-content"
            rows={8}
            value={form.content}
            onChange={(event) => updateForm({ content: event.target.value })}
            placeholder="가이드 내용을 입력해주세요."
            className={fieldControlClass}
          />
        </Field>

        <Field label="영상 URL" id="guide-video-url" hint="선택 입력 — 비워두면 영상 없는 가이드입니다.">
          <input
            id="guide-video-url"
            value={form.videoUrl}
            onChange={(event) => updateForm({ videoUrl: event.target.value })}
            placeholder="https://"
            className={fieldControlClass}
          />
        </Field>

        <div className="border border-line p-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={form.isRequired}
              onChange={(event) => updateForm({ isRequired: event.target.checked })}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span>
              <span className="block text-sm font-semibold text-ink">필수 이수</span>
              <span className="mt-0.5 block text-xs text-muted">
                {form.isRequired
                  ? 'STAFF 자격(qualified) 판정에 포함되는 필수 가이드입니다.'
                  : '선택 가이드입니다 — 자격 판정에는 영향을 주지 않습니다.'}
              </span>
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-3 border border-line p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-ink">퀴즈 문항</div>
              <div className="mt-0.5 text-xs text-muted">{form.quizQuestions.length === 0 ? '퀴즈 없음' : `${form.quizQuestions.length}문항`}</div>
            </div>
            <button
              type="button"
              onClick={addQuestion}
              className="border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
            >
              + 문항 추가
            </button>
          </div>

          {errors.quizQuestions && <p className="text-xs font-medium text-danger">{errors.quizQuestions}</p>}

          {form.quizQuestions.map((question, qIndex) => (
            <div key={qIndex} className="flex flex-col gap-3 border border-line bg-surface p-3.5">
              <div className="flex items-start justify-between gap-2">
                <input
                  value={question.q}
                  onChange={(event) => updateQuestion(qIndex, { q: event.target.value })}
                  placeholder={`문항 ${qIndex + 1} 질문`}
                  className={`${fieldControlClass} bg-white`}
                />
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  aria-label={`문항 ${qIndex + 1} 삭제`}
                  className="flex h-9 shrink-0 items-center justify-center px-2 text-xs font-semibold text-danger transition-colors hover:bg-danger/10"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`question-${qIndex}-answer`}
                      checked={question.answer === oIndex}
                      onChange={() => updateQuestion(qIndex, { answer: oIndex })}
                      aria-label={`보기 ${oIndex + 1}을 정답으로 선택`}
                      className="h-4 w-4 shrink-0 accent-primary"
                    />
                    <input
                      value={option}
                      onChange={(event) => updateOptionText(qIndex, oIndex, event.target.value)}
                      placeholder={`보기 ${oIndex + 1}`}
                      className={`${fieldControlClass} bg-white`}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(qIndex, oIndex)}
                      disabled={question.options.length <= 2}
                      aria-label={`보기 ${oIndex + 1} 삭제`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center text-muted transition-colors hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addOption(qIndex)} className="self-start text-xs font-semibold text-primary hover:text-primary-hover">
                  + 보기 추가
                </button>
              </div>
            </div>
          ))}

          {form.quizQuestions.length > 0 && (
            <Field label="통과 점수" id="guide-pass-score" required error={errors.quizPassScore} hint="0~100점 사이로 입력해주세요.">
              <input
                id="guide-pass-score"
                inputMode="numeric"
                value={form.quizPassScore}
                onChange={(event) => updateForm({ quizPassScore: event.target.value })}
                placeholder="80"
                className={fieldControlClass}
              />
            </Field>
          )}
        </div>

        {(createMutation.isError || updateMutation.isError) && (
          <p className="text-sm font-medium text-danger">저장 중 오류가 발생했습니다. 다시 시도해주세요.</p>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
          <Link to="/admin/education" className="px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-ink">
            취소
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="flex h-11 items-center justify-center gap-2 bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-default disabled:bg-muted"
          >
            {isSaving && <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />}
            저장
          </button>
        </div>
      </form>

      <CompletionRuleNotice />
    </div>
  )
}

export default function EducationEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const guideId = !isNew && id ? Number(id) : null

  const guideQuery = useEducationGuide(guideId)

  function handleSaved() {
    navigate('/admin/education')
  }

  if (!isNew && (id === undefined || guideId === null || Number.isNaN(guideId))) {
    return <p className="text-sm text-danger">잘못된 가이드 경로입니다.</p>
  }

  if (!isNew && guideQuery.isLoading) {
    return <p className="text-sm text-muted">불러오는 중...</p>
  }

  if (!isNew && guideQuery.isError) {
    return <p className="text-sm text-danger">가이드 정보를 불러오지 못했습니다.</p>
  }

  if (!isNew && !guideQuery.data) {
    return <p className="text-sm text-muted">해당 가이드를 찾을 수 없습니다.</p>
  }

  const guide = isNew ? null : guideQuery.data ?? null

  return (
    <div className="flex flex-col gap-5">
      <Link to="/admin/education" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <BackIcon /> LMS 관리
      </Link>

      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">{isNew ? '새 가이드' : guide?.title}</h1>
        <p className="mt-1 text-sm text-muted">{isNew ? '새 LMS 가이드를 작성합니다.' : '가이드 내용을 수정합니다.'}</p>
      </div>

      <EducationGuideEditor key={isNew ? 'new' : guide?.id} guide={guide} isNew={isNew} onSaved={handleSaved} />
    </div>
  )
}
