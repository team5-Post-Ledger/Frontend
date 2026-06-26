import { Link, useParams } from 'react-router'
import { QueryState } from '../../components/QueryState'
import {
  useConfirmTextGuide,
  useEducationGuidePublic,
  useGuideCompletion,
  useRecordVideoComplete,
} from '../../features/education/hooks'
import { useAuthStore } from '../../stores/authStore'
import type { EducationTargetRole } from '../../types'

function resolveRole(role: string | undefined): EducationTargetRole {
  return role === 'EXHIBITOR' ? 'EXHIBITOR' : 'STAFF'
}

export default function EducationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const guideId = id && !Number.isNaN(Number(id)) ? Number(id) : null

  const userRole = useAuthStore((s) => s.user?.role)
  const targetRole = resolveRole(userRole)

  const query = useEducationGuidePublic(guideId)
  const completionQuery = useGuideCompletion(guideId)
  const guide = query.data ?? null
  const completion = completionQuery.data ?? null

  const videoMutation = useRecordVideoComplete(targetRole)
  const confirmMutation = useConfirmTextGuide(targetRole)

  const hasVideo = !!guide?.videoUrl
  const hasQuiz = !!(guide?.quizQuestions?.length && guide?.quizPassScore !== null)
  const isTextOnly = !hasVideo && !hasQuiz

  const videoCompleted = completion?.videoCompleted ?? false
  const passed = completion?.passed ?? false

  // 마지막 성공한 action의 메시지
  const actionMessage = videoMutation.data?.message ?? confirmMutation.data?.message
  const actionError = videoMutation.error?.message ?? confirmMutation.error?.message

  return (
    <div className="flex flex-col gap-4 p-4">
      <Link to="/education" className="text-xs font-semibold text-muted transition-colors hover:text-ink">
        ← 목록으로
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
            {/* 헤더 */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-surface px-2 py-0.5 text-xs font-semibold text-muted">{guide.category}</span>
                {guide.isRequired && (
                  <span className="bg-danger/10 px-2 py-0.5 text-xs font-bold text-danger">필수</span>
                )}
                {passed && (
                  <span className="bg-success/15 px-2 py-0.5 text-xs font-bold text-success">이수 완료</span>
                )}
              </div>
              <h1 className="mt-2 text-xl font-extrabold tracking-tight text-ink">{guide.title}</h1>
            </div>

            {/* action 결과 메시지 */}
            {actionMessage && (
              <div className={`border px-4 py-3 text-sm font-semibold ${
                videoMutation.data?.completed || confirmMutation.data?.completed
                  ? 'border-success/40 bg-success/10 text-success'
                  : 'border-line bg-surface text-ink'
              }`}>
                {actionMessage}
              </div>
            )}
            {actionError && (
              <div className="border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
                {actionError}
              </div>
            )}

            {/* 본문 텍스트 — 항상 표시 */}
            <div className="border border-line bg-white p-5">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{guide.content}</div>
            </div>

            {/* 영상 영역 */}
            {hasVideo && (
              <div className="border border-line bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-sm font-bold text-ink">교육 영상</span>
                  {videoCompleted && (
                    <span className="bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">시청 완료</span>
                  )}
                </div>
                {/* 실제 스트리밍 URL 연결 후 <video> 태그로 교체 */}
                <div className="flex aspect-video items-center justify-center bg-ink/5">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-muted">영상 플레이어</div>
                    <a
                      href={guide.videoUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block break-all text-xs text-primary underline underline-offset-2"
                    >
                      {guide.videoUrl}
                    </a>
                  </div>
                </div>
                {!videoCompleted && (
                  <button
                    type="button"
                    disabled={videoMutation.isPending}
                    onClick={() => videoMutation.mutate(guide.id)}
                    className="mt-4 flex h-11 items-center justify-center gap-2 bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {videoMutation.isPending && (
                      <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />
                    )}
                    시청 완료
                  </button>
                )}
              </div>
            )}

            {/* 퀴즈 섹션 */}
            {hasQuiz && (
              <div className="border border-line bg-white p-5">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-bold text-ink">퀴즈</span>
                  {completion?.quizPassed && (
                    <span className="bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">
                      통과 {completion.quizScore}점
                    </span>
                  )}
                  {completion?.quizPassed === false && completion.quizScore !== null && (
                    <span className="bg-danger/10 px-2 py-0.5 text-[11px] font-bold text-danger">
                      미통과 {completion.quizScore}점
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted">
                  {guide.quizQuestions!.length}문항 · 합격 기준 {guide.quizPassScore}점
                  {hasVideo && !videoCompleted && ' · 영상 시청 후 응시 가능'}
                </p>
                <Link
                  to={`/education/${guide.id}/quiz`}
                  className="mt-4 flex h-11 items-center justify-center bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
                >
                  {completion?.quizPassed === false ? '다시 응시 →' : '퀴즈 응시 →'}
                </Link>
              </div>
            )}

            {/* 텍스트 전용 확인 버튼 */}
            {isTextOnly && !passed && (
              <button
                type="button"
                disabled={confirmMutation.isPending}
                onClick={() => confirmMutation.mutate(guide.id)}
                className="flex h-11 items-center justify-center gap-2 bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirmMutation.isPending && (
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />
                )}
                확인 완료
              </button>
            )}
          </>
        )}
      </QueryState>
    </div>
  )
}
