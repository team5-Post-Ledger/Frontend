import { NavLink, Outlet } from 'react-router'
import { QueryState } from '../../components/QueryState'
import { CHECKIN_METHOD_LABEL, formatMinutesAgo } from '../../features/checkin/format'
import { useRecentCheckins } from '../../features/checkin/hooks'

const TABS = [
  { to: 'qr', label: 'QR 체크인' },
  { to: 'manual', label: '수기 조회' },
  { to: 'walk-in', label: '워크인 등록' },
  { to: 'onsite-payment', label: '현장 결제' },
]

export default function CheckinHubPage() {
  const recentCheckins = useRecentCheckins()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">체크인 허브</h1>
        <p className="mt-1 text-sm text-muted">QR · 수기 · 워크인 · 현장 결제로 현장 체크인을 처리하세요.</p>
      </div>

      {/* 좌측(주 영역)=탭+하위 라우트, 우측(보조 영역)=최근 체크인. 탭을 바꿔도 우측은 Outlet 바깥에
          있어 항상 같은 자리에 유지된다. */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0 lg:flex-[2]">
          <nav className="flex gap-1 border-b border-line">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  [
                    'border-b-2 px-4 py-3 text-sm font-semibold transition-colors',
                    isActive ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink',
                  ].join(' ')
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-5">
            <Outlet />
          </div>
        </div>

        <div className="w-full shrink-0 border border-line bg-surface lg:sticky lg:top-6 lg:flex-1">
          <div className="flex items-center justify-between gap-2 p-4">
            <div className="text-sm font-bold text-ink">방금 처리한 체크인</div>
            <span className="text-xs text-muted">최근 5건</span>
          </div>

          <div className="flex flex-col gap-2.5 px-4 pb-4">
            <QueryState
              isLoading={recentCheckins.isLoading}
              isError={recentCheckins.isError}
              isEmpty={recentCheckins.data?.length === 0}
              emptyMessage="아직 처리한 체크인이 없습니다."
              height={120}
            >
              {recentCheckins.data?.map((checkin) => (
                <div key={checkin.id} className="flex items-center gap-3 border border-line bg-white p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-surface text-xs font-bold text-muted">
                    {checkin.attendeeName.slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-ink">{checkin.attendeeName}</div>
                    <div className="text-xs text-muted">
                      {checkin.groupSize}명 · {checkin.movementMode === 'GROUP' ? '그룹' : '개인'} ·{' '}
                      {CHECKIN_METHOD_LABEL[checkin.checkinMethod]}
                    </div>
                  </div>
                  <div className="shrink-0 text-xs text-muted">{formatMinutesAgo(checkin.minutesAgo)}</div>
                </div>
              ))}
            </QueryState>
          </div>
        </div>
      </div>
    </div>
  )
}
