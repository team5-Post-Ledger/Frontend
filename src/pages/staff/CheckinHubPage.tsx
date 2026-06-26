import { useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { QueryState } from '../../components/QueryState'
import { useMyProgress, useMyStaffExhibitions } from '../../features/staffExhibition/hooks'
import type { StaffExhibitionSummary } from '../../lib/api/staffExhibitions'
import { formatDateRange } from '../../lib/format'
import { useStaffExhibitionStore } from '../../stores/staffExhibitionStore'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '준비중',
  OPEN: '진행중',
  CLOSED: '종료',
}

const TABS = [
  { to: 'qr', label: 'QR 체크인' },
  { to: 'manual', label: '수기 체크인' },
  { to: 'onsite-payment', label: '현장 결제' },
  { to: 'walk-in', label: '워크인 등록' },
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
              <span className="bg-live px-2 py-0.5 text-[10px] font-bold text-ink">
                {STATUS_LABEL[ex.status] ?? ex.status}
              </span>
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

export default function StaffCheckinHubPage() {
  const exhibitionId = useStaffExhibitionStore((s) => s.exhibitionId)
  const setExhibitionId = useStaffExhibitionStore((s) => s.setExhibitionId)
  const navigate = useNavigate()

  const exhibitionsQuery = useMyStaffExhibitions()
  const progressQuery = useMyProgress(exhibitionId)

  // 배정 행사가 1개뿐이면 자동 선택 — 선택 후 Outlet의 index(Navigate to="qr")가 /checkin/qr로 보냄
  useEffect(() => {
    if (exhibitionsQuery.data?.length === 1 && exhibitionId === null) {
      setExhibitionId(exhibitionsQuery.data[0].id)
    }
  }, [exhibitionsQuery.data, exhibitionId, setExhibitionId])

  // ─── 행사 미선택: 피커 ───
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

  // ─── 행사 선택 완료: 허브 셸 ───
  const exhibition = exhibitionsQuery.data?.find((ex) => ex.id === exhibitionId)
  const progress = progressQuery.data
  const isHardGate = exhibition?.enforceStaffQualification ?? false
  const qualified = progress?.qualified ?? true
  const blocked = isHardGate && !qualified

  return (
    <div className="flex flex-col">
      {/* 얇은 자격 경고 배너 — 셸 상단에 항상 노출 */}
      {progress && !qualified && (
        <div
          className={`flex items-center gap-2 border-b px-4 py-2 text-xs font-semibold ${
            isHardGate
              ? 'border-danger/30 bg-danger/10 text-danger'
              : 'border-warning/30 bg-warning/10 text-ink'
          }`}
        >
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isHardGate ? 'bg-danger' : 'bg-warning'}`} />
          <span className="min-w-0 truncate">
            {isHardGate
              ? `필수 교육 미수료 — 체크인 제한됨 (${progress.requiredPassed}/${progress.requiredTotal})`
              : `필수 교육 미수료 경고 (${progress.requiredPassed}/${progress.requiredTotal})`}
          </span>
          <Link to="/education/progress" className="ml-auto shrink-0 underline underline-offset-2">
            자격 현황 →
          </Link>
        </div>
      )}

      {/* 담당 행사 헤더 */}
      <div className="flex items-center justify-between border-b border-line bg-white px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-ink">{exhibition?.title ?? ''}</div>
        </div>
        {/* 복수 배정 시에만 행사 변경 버튼 노출 — 1개면 자동 선택이므로 의미 없음 */}
        {(exhibitionsQuery.data?.length ?? 0) > 1 && (
          <button
            type="button"
            onClick={() => {
              setExhibitionId(null)
              navigate('/checkin', { replace: true })
            }}
            className="ml-3 shrink-0 text-xs font-semibold text-muted transition-colors hover:text-primary"
          >
            행사 변경
          </button>
        )}
      </div>

      {/* 4개 탭 — 하드 게이트 + 미수료면 pointer-events-none으로 비활성 */}
      <nav className="flex overflow-x-auto border-b border-line bg-white">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end
            aria-disabled={blocked || undefined}
            className={({ isActive }) =>
              [
                'shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-semibold transition-colors',
                blocked ? 'pointer-events-none opacity-40' : '',
                isActive ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink',
              ]
                .filter(Boolean)
                .join(' ')
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {/* 탭 콘텐츠 — 하드 게이트 활성 + 미수료면 Outlet 대신 차단 안내(한 곳에서만 보장, §2.6) */}
      {blocked ? (
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm font-bold text-danger">필수 교육을 완료해야 체크인 작업을 이용할 수 있습니다.</p>
          <Link to="/education/progress" className="text-xs font-bold text-primary underline underline-offset-2">
            자격 현황 확인 →
          </Link>
        </div>
      ) : (
        <Outlet />
      )}
    </div>
  )
}
