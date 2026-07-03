import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { CongestionGauge } from '../../components/CongestionGauge'
import { DetailLayout } from '../../components/DetailLayout'
import { QueryState } from '../../components/QueryState'
import { useBoothCategories, useBoothsByExhibition } from '../../features/booth/hooks'
import { useCongestionLive } from '../../features/congestion/hooks'
import { getExhibitionDisplayStatus } from '../../features/exhibition/displayStatus'
import { useExhibition } from '../../features/exhibition/hooks'
import { useSessions } from '../../features/session/hooks'
import { formatDateRange } from '../../lib/format'
import { useReserveStore } from '../../stores/reserveStore'

function LocationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function ReserveCtaButton({ exhibitionId, className = '' }: { exhibitionId: number; className?: string }) {
  const navigate = useNavigate()
  const setSelection = useReserveStore((state) => state.setSelection)

  function handleClick() {
    // /reserve가 박람회를 다시 고르지 않도록 위저드 상태(reserveStore)에 미리 담아둔다.
    // 슬롯/티켓은 박람회에 종속되므로 같이 초기화한다.
    setSelection({ exhibitionId, timeSlotId: null, ticketTypeId: null })
    navigate('/reserve')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex h-12 items-center justify-center bg-primary px-8 text-sm font-bold text-white transition-colors hover:bg-primary-hover ${className}`}
    >
      예약하기
    </button>
  )
}

export default function ExhibitionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const exhibitionId = id ? Number(id) : null

  const exhibition = useExhibition(exhibitionId)
  const booths = useBoothsByExhibition(exhibitionId)
  const categories = useBoothCategories(exhibitionId)
  const sessions = useSessions(exhibitionId)
  const congestion = useCongestionLive(exhibitionId)

  const [categoryFilter, setCategoryFilter] = useState<number | 'ALL'>('ALL')

  const exhibitionCategories = useMemo(
    () => categories.data?.filter((category) => category.exhibitionId === exhibitionId) ?? [],
    [categories.data, exhibitionId],
  )

  const categoryNameById = useMemo(() => {
    const map = new Map<number, string>()
    exhibitionCategories.forEach((category) => map.set(category.id, category.name))
    return map
  }, [exhibitionCategories])

  const filteredBooths = useMemo(() => {
    const data = booths.data ?? []
    if (categoryFilter === 'ALL') return data
    return data.filter((booth) => booth.categoryId === categoryFilter)
  }, [booths.data, categoryFilter])

  if (exhibitionId === null) {
    return <p className="p-6 text-sm text-danger">잘못된 박람회 경로입니다.</p>
  }

  if (exhibition.isLoading) {
    return <p className="p-6 text-sm text-muted">불러오는 중...</p>
  }

  if (exhibition.isError || !exhibition.data) {
    return (
      <div className="p-6">
        <p className="text-sm text-danger">박람회를 찾을 수 없습니다.</p>
        <Link to="/exhibitions" className="mt-2 inline-block text-sm font-semibold text-primary hover:text-primary-hover">
          박람회 목록으로 →
        </Link>
      </div>
    )
  }

  const data = exhibition.data
  const status = getExhibitionDisplayStatus(data)
  const boothCount = booths.data?.length ?? 0
  const sessionCount = sessions.data?.length ?? 0

  return (
    <div className="p-5 pb-28 lg:p-8 lg:pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <DetailLayout
            title={data.title}
            subtitle={`${data.venue}에서 열리는 박람회로, 부스 ${boothCount}개와 세션 ${sessionCount}개를 만나볼 수 있어요.`}
            badge={<span className={`px-2.5 py-1 text-[11px] font-bold ${status.badgeClassName}`}>{status.label}</span>}
            attributes={[
              { label: '기간', value: formatDateRange(data.startDate, data.endDate) },
              {
                label: '장소',
                value: (
                  <span className="flex items-center gap-1.5">
                    <LocationIcon />
                    {data.venue} · {data.address}
                  </span>
                ),
              },
              { label: '부스', value: `${boothCount}개` },
              { label: '세션', value: `${sessionCount}개` },
            ]}
          >
            <div className="border border-line bg-white p-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs text-muted">실시간 혼잡도</span>
                <Link
                  to={`/exhibitions/${exhibitionId}/congestion`}
                  className="text-xs font-semibold text-primary hover:text-primary-hover"
                >
                  지도로 보기 →
                </Link>
              </div>
              <QueryState isLoading={congestion.isLoading} isError={congestion.isError} height={56}>
                {congestion.data && <CongestionGauge level={congestion.data.level} />}
              </QueryState>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-base font-bold text-ink">부스 둘러보기</div>
                <Link to={`/exhibitions/${exhibitionId}/booths`} className="text-sm font-semibold text-primary hover:text-primary-hover">
                  전체 →
                </Link>
              </div>

              {exhibitionCategories.length > 0 && (
                <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('ALL')}
                    className={`shrink-0 px-3 py-1.5 text-xs font-semibold transition-colors ${
                      categoryFilter === 'ALL' ? 'bg-ink text-white' : 'border border-line text-muted hover:text-ink'
                    }`}
                  >
                    전체
                  </button>
                  {exhibitionCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setCategoryFilter(category.id)}
                      className={`shrink-0 px-3 py-1.5 text-xs font-semibold transition-colors ${
                        categoryFilter === category.id ? 'bg-ink text-white' : 'border border-line text-muted hover:text-ink'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}

              <QueryState
                isLoading={booths.isLoading}
                isError={booths.isError}
                isEmpty={filteredBooths.length === 0}
                emptyMessage="등록된 부스가 없습니다."
                height={120}
              >
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {filteredBooths.map((booth) => (
                    <Link
                      key={booth.id}
                      to={`/exhibitions/${exhibitionId}/booths/${booth.id}`}
                      className="block w-[160px] shrink-0 border border-line bg-white transition-colors hover:border-primary"
                    >
                      <div className="h-24 bg-[repeating-linear-gradient(45deg,var(--color-line)_0,var(--color-line)_8px,var(--color-surface)_8px,var(--color-surface)_16px)]" />
                      <div className="p-3">
                        <div className="mb-1.5 line-clamp-1 text-sm font-bold text-ink">{booth.name}</div>
                        <div className="mb-2 text-xs text-muted">
                          {booth.floor}F · ({booth.posX}, {booth.posY})
                        </div>
                        {booth.categoryId && (
                          <span className="bg-surface px-1.5 py-0.5 text-[10.5px] text-muted">
                            {categoryNameById.get(booth.categoryId) ?? '-'}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </QueryState>
            </div>

            <div>
              <div className="mb-3 text-base font-bold text-ink">세션 일정</div>

              <QueryState
                isLoading={sessions.isLoading}
                isError={sessions.isError}
                isEmpty={sessions.data?.length === 0}
                emptyMessage="등록된 세션이 없습니다."
                height={120}
              >
                <div className="flex flex-col">
                  {sessions.data?.map((session, index) => (
                    <div key={session.id} className="flex gap-3">
                      <div className="w-12 shrink-0 pt-0.5 text-right text-xs font-bold text-ink">{formatTime(session.startAt)}</div>
                      <div className="flex shrink-0 flex-col items-center">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                        {index < (sessions.data?.length ?? 0) - 1 && <span className="w-px flex-1 bg-line" />}
                      </div>
                      <div className="pb-5">
                        <div className="text-sm font-bold text-ink">{session.title}</div>
                        <div className="mt-0.5 text-xs text-muted">{session.location}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </QueryState>
            </div>
          </DetailLayout>
        </div>

        {/* lg+: 우측 sticky 예약 패널 — 헤더(VisitorLayout, h-16)와 겹치지 않도록 top-20에서 고정 */}
        <aside className="hidden lg:block lg:w-[280px] lg:shrink-0">
          <div className="border border-line bg-white p-5 lg:sticky lg:top-20">
            <div className="text-sm font-bold text-ink">예약하기</div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              {formatDateRange(data.startDate, data.endDate)}
              <br />
              {data.venue}
            </p>
            <ReserveCtaButton exhibitionId={exhibitionId} className="mt-4 w-full" />
          </div>
        </aside>
      </div>

      {/* lg 미만: 화면 하단 고정 바 — VisitorLayout 하단 탭(h-16) 바로 위에 고정 */}
      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-line bg-white p-4 lg:hidden">
        <ReserveCtaButton exhibitionId={exhibitionId} className="w-full" />
      </div>
    </div>
  )
}
