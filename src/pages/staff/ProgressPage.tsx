import { Link } from 'react-router'
import { QueryState } from '../../components/QueryState'
import { useMyProgress, useMyStaffExhibitions } from '../../features/staffExhibition/hooks'
import { useStaffExhibitionStore } from '../../stores/staffExhibitionStore'
import type { GuideProgressItem } from '../../lib/api/staffExhibitions'

// 영상/퀴즈 진행 힌트 — 명시적으로 완료된 항목만 표시
function ProgressHints({ guide }: { guide: GuideProgressItem }) {
  if (guide.videoCompleted !== true && guide.quizScore === null) return null
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {guide.videoCompleted === true && (
        <span className="bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">영상 완료</span>
      )}
      {guide.quizScore !== null && (
        <span className="bg-line px-1.5 py-0.5 text-[10px] font-semibold text-muted">
          퀴즈 {guide.quizScore}점
        </span>
      )}
    </div>
  )
}

function IncompleteGuideRow({ guide }: { guide: GuideProgressItem }) {
  return (
    <Link
      to={`/education/${guide.guideId}`}
      className="flex items-start justify-between gap-3 border-b border-line px-4 py-4 last:border-b-0 transition-colors hover:bg-surface"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-muted">{guide.category}</span>
        </div>
        <div className="mt-0.5 text-sm font-semibold text-ink">{guide.title}</div>
        <ProgressHints guide={guide} />
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        <span className="bg-line px-2 py-0.5 text-[11px] font-bold text-muted">미수료</span>
        <span className="text-xs text-muted">›</span>
      </div>
    </Link>
  )
}

function CompleteGuideRow({ guide }: { guide: GuideProgressItem }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0 opacity-70">
      <div className="min-w-0">
        <div className="text-xs text-muted">{guide.category}</div>
        <div className="mt-0.5 text-sm font-semibold text-ink">{guide.title}</div>
      </div>
      <span className="shrink-0 bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">수료</span>
    </div>
  )
}

export default function ProgressPage() {
  const exhibitionId = useStaffExhibitionStore((s) => s.exhibitionId)
  const exhibitionsQuery = useMyStaffExhibitions()
  const progressQuery = useMyProgress(exhibitionId)

  // 행사 미선택 상태
  if (exhibitionId === null) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <p className="text-sm text-muted">자격 현황을 확인하려면 먼저 행사를 선택하세요.</p>
        <Link
          to="/checkin"
          className="text-sm font-semibold text-primary underline underline-offset-2"
        >
          행사 선택 →
        </Link>
      </div>
    )
  }

  const exhibition = exhibitionsQuery.data?.find((ex) => ex.id === exhibitionId) ?? null
  const progress = progressQuery.data ?? null
  const isHardGate = exhibition?.enforceStaffQualification ?? false
  const qualified = progress?.qualified ?? false

  const incomplete = progress?.guides.filter((g) => !g.passed) ?? []
  const complete = progress?.guides.filter((g) => g.passed) ?? []

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 헤더 */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">자격 현황</h1>
        {exhibition && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="truncate text-sm text-muted">{exhibition.title}</span>
            <span
              className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold ${
                isHardGate ? 'bg-danger/10 text-danger' : 'bg-warning/15 text-warning'
              }`}
            >
              {isHardGate ? '하드 게이트' : '소프트 게이트'}
            </span>
          </div>
        )}
      </div>

      <QueryState
        isLoading={progressQuery.isLoading || exhibitionsQuery.isLoading}
        isError={progressQuery.isError}
        height={200}
      >
        {progress && (
          <>
            {/* 자격 상태 큰 표시 */}
            <div
              className={`border px-5 py-5 ${
                qualified
                  ? 'border-success/40 bg-success/10'
                  : isHardGate
                    ? 'border-danger/30 bg-danger/5'
                    : 'border-warning/40 bg-warning/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center text-xl font-extrabold ${
                    qualified ? 'bg-success/20 text-success' : isHardGate ? 'bg-danger/15 text-danger' : 'bg-warning/20 text-warning'
                  }`}
                >
                  {qualified ? '✓' : '✗'}
                </span>
                <div>
                  <div
                    className={`text-lg font-extrabold tracking-tight ${
                      qualified ? 'text-success' : isHardGate ? 'text-danger' : 'text-ink'
                    }`}
                  >
                    {qualified ? '자격 충족' : '자격 미충족'}
                  </div>
                  <div className="mt-0.5 text-sm text-muted">
                    필수 항목 {progress.requiredPassed}/{progress.requiredTotal}개 수료
                  </div>
                </div>
              </div>

              {/* 게이트 유형별 안내 */}
              {!qualified && (
                <p className="mt-3 text-xs leading-relaxed text-ink">
                  {isHardGate
                    ? '이 행사는 미수료 시 체크인·현장 결제·워크인이 제한됩니다. 아래 항목을 모두 수료하세요.'
                    : '이 행사는 필수 교육 미수료 시 경고가 표시됩니다. 체크인은 가능하지만 수료를 권장합니다.'}
                </p>
              )}
              {qualified && (
                <p className="mt-2 text-xs text-muted">체크인 작업 이용이 가능합니다.</p>
              )}
            </div>

            {/* 미수료 필수 항목 */}
            {incomplete.length > 0 && (
              <div>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">
                  완료해야 할 항목 ({incomplete.length})
                </div>
                <div className="border border-line bg-white">
                  {incomplete.map((guide) => (
                    <IncompleteGuideRow key={guide.guideId} guide={guide} />
                  ))}
                </div>
              </div>
            )}

            {/* 수료 완료 항목 */}
            {complete.length > 0 && (
              <div>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">
                  수료 완료 ({complete.length})
                </div>
                <div className="border border-line bg-white">
                  {complete.map((guide) => (
                    <CompleteGuideRow key={guide.guideId} guide={guide} />
                  ))}
                </div>
              </div>
            )}

            {/* 하단 빠른 이동 */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/education"
                className="text-sm font-semibold text-primary underline underline-offset-2 transition-colors hover:text-primary-hover"
              >
                교육 목록 →
              </Link>
              <Link
                to="/checkin"
                className="text-sm font-semibold text-muted transition-colors hover:text-ink"
              >
                체크인 홈으로
              </Link>
            </div>
          </>
        )}
      </QueryState>
    </div>
  )
}
