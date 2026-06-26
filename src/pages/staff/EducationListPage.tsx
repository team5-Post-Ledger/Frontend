import { useMemo } from 'react'
import { Link } from 'react-router'
import { QueryState } from '../../components/QueryState'
import { useEducationGuidesByRole } from '../../features/education/hooks'
import { useMyProgress } from '../../features/staffExhibition/hooks'
import { useAuthStore } from '../../stores/authStore'
import { useStaffExhibitionStore } from '../../stores/staffExhibitionStore'
import type { EducationGuidePublic, EducationTargetRole } from '../../types'

// staffPassed=undefined → EXHIBITOR "확인 전" 중립 뱃지
// staffPassed=true/false → STAFF 수료/미수료 뱃지
function GuideBadge({ isRequired, staffPassed }: { isRequired: boolean; staffPassed?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {isRequired && (
        <span className="bg-danger/10 px-1.5 py-0.5 text-[10px] font-bold text-danger">필수</span>
      )}
      {staffPassed === undefined ? (
        <span className="bg-line px-2 py-0.5 text-[11px] font-bold text-muted">확인 전</span>
      ) : (
        <span
          className={
            staffPassed
              ? 'bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success'
              : 'bg-line px-2 py-0.5 text-[11px] font-bold text-muted'
          }
        >
          {staffPassed ? '수료' : '미수료'}
        </span>
      )}
    </div>
  )
}

function GuideItem({ guide, staffPassed }: { guide: EducationGuidePublic; staffPassed?: boolean }) {
  const hasVideo = !!guide.videoUrl
  const hasQuiz = !!(guide.quizQuestions?.length && guide.quizPassScore !== null)
  const typeLabel = hasVideo && hasQuiz ? '영상+퀴즈' : hasVideo ? '영상' : hasQuiz ? '퀴즈' : '텍스트'

  return (
    <Link
      to={`/education/${guide.id}`}
      className="flex items-center justify-between gap-3 border-b border-line px-4 py-4 last:border-b-0 transition-colors hover:bg-surface"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-muted">{guide.category}</span>
          <span className="text-[10px] text-muted">·</span>
          <span className="text-[10px] font-semibold text-muted">{typeLabel}</span>
        </div>
        <div className="mt-0.5 text-sm font-semibold text-ink">{guide.title}</div>
      </div>
      <GuideBadge isRequired={guide.isRequired} staffPassed={staffPassed} />
    </Link>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="border-b border-line px-4 py-2.5">
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</span>
    </div>
  )
}

export default function EducationListPage() {
  const user = useAuthStore((s) => s.user)
  const isStaff = user?.role === 'STAFF'

  const staffExhibitionId = useStaffExhibitionStore((s) => s.exhibitionId)

  const targetRole: EducationTargetRole | null =
    isStaff ? 'STAFF' : user?.role === 'EXHIBITOR' ? 'EXHIBITOR' : null

  // EXHIBITOR는 qualified/progress 개념 없음 — null 전달로 쿼리 비활성화
  const progressQuery = useMyProgress(isStaff ? staffExhibitionId : null)

  const guidesQuery = useEducationGuidesByRole(targetRole)

  const passedSet = useMemo(() => {
    if (!isStaff) return new Set<number>()
    const set = new Set<number>()
    progressQuery.data?.guides.forEach((g) => {
      if (g.passed) set.add(g.guideId)
    })
    return set
  }, [isStaff, progressQuery.data])

  const required = guidesQuery.data?.filter((g) => g.isRequired) ?? []
  const optional = guidesQuery.data?.filter((g) => !g.isRequired) ?? []

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">
          {isStaff ? '교육 목록' : '매뉴얼'}
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          {isStaff
            ? '필수 교육을 모두 수료해야 체크인 작업을 진행할 수 있습니다.'
            : '참가기업 가이드를 확인하세요.'}
        </p>
      </div>

      <QueryState
        isLoading={guidesQuery.isLoading}
        isError={guidesQuery.isError}
        isEmpty={guidesQuery.data?.length === 0}
        emptyMessage="해당하는 교육 항목이 없습니다."
        height={200}
      >
        <div className="border border-line bg-white">
          {required.length > 0 && (
            <>
              <SectionHeader label={`필수 (${required.length})`} />
              {required.map((guide) => (
                <GuideItem
                  key={guide.id}
                  guide={guide}
                  staffPassed={isStaff ? passedSet.has(guide.id) : undefined}
                />
              ))}
            </>
          )}
          {optional.length > 0 && (
            <>
              <SectionHeader label={`선택 (${optional.length})`} />
              {optional.map((guide) => (
                <GuideItem
                  key={guide.id}
                  guide={guide}
                  staffPassed={isStaff ? passedSet.has(guide.id) : undefined}
                />
              ))}
            </>
          )}
        </div>
      </QueryState>
    </div>
  )
}
