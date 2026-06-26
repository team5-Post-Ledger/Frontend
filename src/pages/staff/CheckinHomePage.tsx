import { useEffect } from 'react'
import { Link } from 'react-router'
import { QueryState } from '../../components/QueryState'
import { useMyProgress, useMyStaffExhibitions } from '../../features/staffExhibition/hooks'
import { formatDateRange } from '../../lib/format'
import { useStaffExhibitionStore } from '../../stores/staffExhibitionStore'
import type { StaffExhibitionSummary } from '../../lib/api/staffExhibitions'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '준비중',
  OPEN: '진행중',
  CLOSED: '종료',
}

const CHECKIN_ACTIONS = [
  { to: '/checkin/qr', label: 'QR 체크인', description: '모바일 티켓 QR → 네임태그 바인딩' },
  { to: '/checkin/manual', label: '수기 체크인', description: '이름·전화·예약번호로 조회' },
  { to: '/checkin/onsite-payment', label: '현장 결제', description: '미결제 예약 현장 결제 처리' },
  { to: '/checkin/walk-in', label: '워크인 등록', description: '예약 없는 방문자 현장 등록' },
]

function ExhibitionPicker({
  exhibitions,
  onSelect,
}: {
  exhibitions: StaffExhibitionSummary[]
  onSelect: (id: number) => void
}) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-lg font-extrabold tracking-tight text-ink">담당 행사 선택</h1>
        <p className="mt-1 text-sm text-muted">체크인을 진행할 행사를 선택하세요.</p>
      </div>

      <div className="flex flex-col gap-3">
        {exhibitions.map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => onSelect(ex.id)}
            className="flex items-start justify-between border border-line bg-white p-4 text-left transition-colors hover:border-primary hover:bg-surface"
          >
            <div className="min-w-0">
              <div className="font-bold text-ink">{ex.title}</div>
              <div className="mt-1 text-xs text-muted">{ex.venue}</div>
              <div className="mt-0.5 text-xs text-muted">{formatDateRange(ex.startDate, ex.endDate)}</div>
            </div>
            <div className="ml-3 flex shrink-0 flex-col items-end gap-1.5">
              <span className="bg-live px-2 py-0.5 text-[10px] font-bold text-ink">{STATUS_LABEL[ex.status] ?? ex.status}</span>
              {ex.enforceStaffQualification && (
                <span className="border border-danger px-2 py-0.5 text-[10px] font-bold text-danger">자격 필수</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function QualificationBanner({
  qualified,
  enforceStaffQualification,
  requiredTotal,
  requiredPassed,
}: {
  qualified: boolean
  enforceStaffQualification: boolean
  requiredTotal: number
  requiredPassed: number
}) {
  if (qualified) {
    return (
      <div className="flex items-center gap-2 border border-success bg-success/10 px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-success" />
        <span className="text-sm font-semibold text-ink">필수 교육 수료 완료 — 체크인 권한 정상</span>
      </div>
    )
  }

  if (enforceStaffQualification) {
    return (
      <div className="border border-danger bg-danger/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-danger" />
          <span className="text-sm font-bold text-danger">필수 교육 미수료 — 체크인 권한 제한됨</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-ink">
          이 행사는 LMS 수료 하드 게이트가 활성화되어 있습니다. 필수 교육을 완료해야 체크인·현장 결제·워크인 처리가 가능합니다.
          ({requiredPassed}/{requiredTotal}개 수료)
        </p>
        <div className="mt-2 flex flex-wrap gap-4">
          <Link to="/education" className="text-xs font-bold text-primary underline underline-offset-2">
            교육 목록 →
          </Link>
          <Link to="/education/progress" className="text-xs font-bold text-primary underline underline-offset-2">
            자격 현황에서 확인 →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-warning bg-warning/10 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-warning" />
        <span className="text-sm font-bold text-ink">필수 교육 미수료 (경고)</span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">
        체크인은 가능하지만 필수 교육 수료를 권장합니다. ({requiredPassed}/{requiredTotal}개 수료)
      </p>
      <div className="mt-2 flex flex-wrap gap-4">
        <Link to="/education" className="text-xs font-bold text-primary underline underline-offset-2">
          교육 목록 →
        </Link>
        <Link to="/education/progress" className="text-xs font-bold text-primary underline underline-offset-2">
          자격 현황에서 확인 →
        </Link>
      </div>
    </div>
  )
}

export default function CheckinHomePage() {
  const exhibitionId = useStaffExhibitionStore((state) => state.exhibitionId)
  const setExhibitionId = useStaffExhibitionStore((state) => state.setExhibitionId)

  const exhibitionsQuery = useMyStaffExhibitions()
  const progressQuery = useMyProgress(exhibitionId)

  // 배정 행사가 1개뿐이면 자동 선택한다 — 임의 1번 고정이 아니라 "내 배정 목록" 기준이다(§2.5).
  useEffect(() => {
    if (exhibitionsQuery.data?.length === 1 && exhibitionId === null) {
      setExhibitionId(exhibitionsQuery.data[0].id)
    }
  }, [exhibitionsQuery.data, exhibitionId, setExhibitionId])

  // --- 행사 미선택 분기 ---
  if (exhibitionId === null) {
    return (
      <QueryState
        isLoading={exhibitionsQuery.isLoading}
        isError={exhibitionsQuery.isError}
        isEmpty={exhibitionsQuery.data?.length === 0}
        emptyMessage="배정된 행사가 없습니다. 관리자에게 문의하세요."
        height={200}
      >
        {exhibitionsQuery.data && exhibitionsQuery.data.length > 1 && (
          <ExhibitionPicker exhibitions={exhibitionsQuery.data} onSelect={setExhibitionId} />
        )}
      </QueryState>
    )
  }

  // --- 행사 선택 완료 분기 ---
  const exhibition = exhibitionsQuery.data?.find((ex) => ex.id === exhibitionId)
  const progress = progressQuery.data
  const isHardGate = exhibition?.enforceStaffQualification ?? false
  const qualified = progress?.qualified ?? false

  return (
    <div className="flex flex-col">
      {/* 선택된 행사 헤더 */}
      <div className="border-b border-line bg-white px-4 py-4">
        {exhibition ? (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-extrabold tracking-tight text-ink">{exhibition.title}</div>
              <div className="mt-0.5 text-xs text-muted">{exhibition.venue}</div>
              <div className="mt-0.5 text-xs text-muted">{formatDateRange(exhibition.startDate, exhibition.endDate)}</div>
            </div>
            <button
              type="button"
              onClick={() => setExhibitionId(null)}
              className="shrink-0 text-xs font-semibold text-muted transition-colors hover:text-primary"
            >
              행사 변경
            </button>
          </div>
        ) : exhibitionsQuery.isLoading ? (
          <div className="h-12 animate-pulse bg-line" />
        ) : null}
      </div>

      {/* 자격 경고 배너 */}
      <div className="border-b border-line">
        {progressQuery.isLoading ? (
          <div className="px-4 py-3">
            <div className="h-4 w-3/4 animate-pulse bg-line" />
            <div className="mt-2 h-3 w-1/2 animate-pulse bg-line" />
          </div>
        ) : progress ? (
          <QualificationBanner
            qualified={qualified}
            enforceStaffQualification={isHardGate}
            requiredTotal={progress.requiredTotal}
            requiredPassed={progress.requiredPassed}
          />
        ) : null}
      </div>

      {/* 체크인 작업 진입 카드 */}
      <div className="flex flex-col gap-0.5 p-4">
        <div className="mb-3 text-sm font-bold text-ink">체크인 작업 선택</div>
        {CHECKIN_ACTIONS.map(({ to, label, description }) => {
          const blocked = isHardGate && !qualified
          return (
            <Link
              key={to}
              to={to}
              aria-disabled={blocked}
              onClick={blocked ? (e) => e.preventDefault() : undefined}
              className={[
                'flex items-center justify-between border border-line bg-white p-4 transition-colors',
                blocked
                  ? 'cursor-not-allowed opacity-40'
                  : 'hover:border-primary hover:bg-surface',
              ].join(' ')}
            >
              <div className="min-w-0">
                <div className="text-sm font-bold text-ink">{label}</div>
                <div className="mt-0.5 text-xs text-muted">{description}</div>
              </div>
              <span className="ml-3 shrink-0 text-muted">›</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
