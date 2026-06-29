import { Link, useParams } from 'react-router'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Panel } from '../../components/Panel'
import { QueryState } from '../../components/QueryState'
import { StatCard } from '../../components/StatCard'
import { useExhibitorPointStats } from '../../features/exhibitorStats/hooks'
import { useExhibitorContext, useScanPoints } from '../../features/scanner/hooks'

function formatDwellSec(sec: number) {
  if (sec === 0) return '-'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s > 0 ? `${m}분 ${s}초` : `${m}분`
}

function autoExitColorClass(ratio: number) {
  if (ratio >= 0.3) return 'text-warning'
  if (ratio < 0.15) return 'text-success'
  return 'text-ink'
}

function TagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function ScanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 17h7M17 14v7" />
    </svg>
  )
}

export default function ExhibitorBoothDetailPage() {
  const { boothId } = useParams<{ boothId: string }>()
  const id = Number(boothId)

  const contextQuery = useExhibitorContext()
  const scanPointsQuery = useScanPoints()
  const statsQuery = useExhibitorPointStats(
    Number.isFinite(id) ? { scanPointType: 'BOOTH', scanPointId: id } : null,
  )

  const displayName =
    scanPointsQuery.data?.find((p) => p.scanPointType === 'BOOTH' && p.scanPointId === id)
      ?.displayName ?? `부스 #${id}`

  const stats = statsQuery.data
  const isEmpty = stats !== undefined && stats.visitCount === 0

  const hourlyData = (stats?.hourly ?? []).map((h) => ({
    label: `${h.statHour}시`,
    visitorCount: h.visitorCount,
  }))

  const dwellData = stats?.dwellDistribution ?? []
  const autoExitRatioPct =
    stats?.autoExitRatio !== undefined ? Math.round(stats.autoExitRatio * 100) : null

  return (
    <div className="min-h-screen bg-surface">
      {/* 페이지 헤더 */}
      <div className="border-b border-line bg-white px-4 py-4 sm:px-6">
        <Link
          to="/exhibitor/stats"
          className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-muted transition-colors hover:text-primary"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          리포트로 돌아가기
        </Link>
        <QueryState isLoading={contextQuery.isLoading} isError={contextQuery.isError} height={20}>
          <p className="text-xs text-muted">{contextQuery.data?.exhibitionTitle ?? ''}</p>
        </QueryState>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-xl font-extrabold tracking-tight text-ink">
            {displayName} 상세 리포트
          </h1>
          <span className="shrink-0 border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted">
            오늘
          </span>
        </div>
      </div>

      <div className="px-4 py-5 sm:px-6">
        {/* KPI 4종 — PR3과 동일 구성, visitorCount·uniqueAttendee 분리 유지 */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {/* 방문 인원 — visitorCount (head_count 합, GROUP 가중) */}
          <div className="col-span-2 lg:col-span-1">
            <div className="h-full border border-line bg-shell p-5">
              <p className="text-xs font-medium text-white/55">방문 인원</p>
              {statsQuery.isLoading ? (
                <p className="mt-2 text-sm text-white/55">불러오는 중...</p>
              ) : statsQuery.isError ? (
                <p className="mt-2 text-sm text-danger">오류</p>
              ) : (
                <>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold leading-none tracking-tight text-white">
                      {stats?.visitorCount.toLocaleString() ?? '-'}
                    </span>
                    <span className="text-sm font-semibold text-white/55">명</span>
                  </div>
                  <p className="mt-2 text-xs text-white/40">GROUP 가중 실제 방문 인원</p>
                </>
              )}
            </div>
          </div>

          {/* 태그 수 — uniqueAttendee (distinct attendee, GROUP 대표 1) */}
          <StatCard
            label="태그 수"
            icon={<span className="text-primary"><TagIcon /></span>}
            isLoading={statsQuery.isLoading}
            isError={statsQuery.isError}
          >
            {stats && (
              <>
                <div className="flex items-baseline gap-1 text-[28px] font-extrabold leading-none tracking-tight text-ink">
                  {stats.uniqueAttendee.toLocaleString()}
                  <span className="text-sm font-semibold text-muted">명</span>
                </div>
                <p className="mt-2 text-xs text-muted">distinct attendee (대표 1)</p>
              </>
            )}
          </StatCard>

          {/* 평균 체류시간 — avgDwellSec (SUM(sum_dwell_sec)/SUM(dwell_count)) */}
          <StatCard
            label="평균 체류시간"
            icon={<span className="text-primary"><ClockIcon /></span>}
            isLoading={statsQuery.isLoading}
            isError={statsQuery.isError}
          >
            {stats && (
              <>
                <div className="text-[28px] font-extrabold leading-none tracking-tight text-ink">
                  {formatDwellSec(stats.avgDwellSec)}
                </div>
                <p className="mt-2 text-xs text-muted">마감 체류 SUM/SUM 기준</p>
              </>
            )}
          </StatCard>

          {/* 총 스캔 수 — visitCount */}
          <StatCard
            label="총 스캔 수"
            icon={<span className="text-primary"><ScanIcon /></span>}
            isLoading={statsQuery.isLoading}
            isError={statsQuery.isError}
          >
            {stats && (
              <>
                <div className="flex items-baseline gap-1 text-[28px] font-extrabold leading-none tracking-tight text-ink">
                  {stats.visitCount.toLocaleString()}
                  <span className="text-sm font-semibold text-muted">회</span>
                </div>
                <p className="mt-2 text-xs text-muted">ENTRY 스캔 이벤트 수</p>
              </>
            )}
          </StatCard>
        </div>

        {/* 인원·태그수 차이 안내 */}
        {stats && stats.visitorCount > stats.uniqueAttendee && (
          <div className="mt-3 border border-line bg-white p-4">
            <p className="text-xs font-semibold text-ink">
              방문 인원({stats.visitorCount}명) &gt; 태그 수({stats.uniqueAttendee}명)
            </p>
            <p className="mt-1 text-xs text-muted">
              GROUP 단체 방문이 포함돼 head_count 가중 인원이 distinct 태그 수보다 많습니다.
            </p>
          </div>
        )}

        {/* 자동 EXIT 비율 — visit_log.is_auto_exit / 전체 EXIT, 데이터 품질 신호 */}
        <div className="mt-4">
          <Panel
            title="자동 EXIT 비율"
            subtitle="visit_log.is_auto_exit 기준"
          >
            <QueryState
              isLoading={statsQuery.isLoading}
              isError={statsQuery.isError}
              isEmpty={isEmpty}
              emptyMessage="스캔 기록이 없습니다."
              height={80}
            >
              {autoExitRatioPct !== null && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                  <div className={`text-4xl font-extrabold leading-none tracking-tight ${autoExitColorClass(stats?.autoExitRatio ?? 0)}`}>
                    {autoExitRatioPct}
                    <span className="ml-0.5 text-lg font-semibold">%</span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted">
                    방문자가 직접 EXIT 스캔 없이 다음 부스 ENTRY 또는 60분 타임아웃으로 체류가 마감된 비율입니다.
                    높을수록 EXIT 스캔 누락이 많으며, 체류시간 측정 정밀도가 낮아질 수 있습니다.
                  </p>
                </div>
              )}
            </QueryState>
          </Panel>
        </div>

        {/* 체류시간 분포(추정) — visit_dwell.dwell_seconds 버킷 카운트 */}
        <div className="mt-4">
          <Panel
            title="체류시간 분포(추정)"
            subtitle="visit_dwell 마감 건 기준 · 자동 EXIT 포함"
          >
            <QueryState
              isLoading={statsQuery.isLoading}
              isError={statsQuery.isError}
              isEmpty={isEmpty || dwellData.length === 0}
              emptyMessage="체류시간 데이터가 없습니다."
              height={160}
            >
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dwellData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                    <XAxis
                      dataKey="bucketLabel"
                      tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 12, border: '1px solid var(--color-line)', borderRadius: 0 }}
                      formatter={(v) => [`${Number(v).toLocaleString()}건`, '방문 수']}
                    />
                    <Bar dataKey="count" fill="var(--color-accent)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </QueryState>
          </Panel>
        </div>

        {/* 시간대별 방문 인원 차트 — PR3 재활용 */}
        <div className="mt-4">
          <Panel title="시간대별 방문 인원" subtitle="visitorCount · stat_visit_point 기준">
            <QueryState
              isLoading={statsQuery.isLoading}
              isError={statsQuery.isError}
              isEmpty={isEmpty || hourlyData.length === 0}
              emptyMessage="시간대 데이터가 없습니다."
              height={200}
            >
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 12, border: '1px solid var(--color-line)', borderRadius: 0 }}
                      formatter={(v) => [`${Number(v).toLocaleString()}명`, '방문 인원']}
                    />
                    <Bar dataKey="visitorCount" fill="var(--color-primary)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </QueryState>
          </Panel>
        </div>

        {/* 빈 상태 */}
        {isEmpty && (
          <div className="mt-4 border border-line bg-white p-5 text-center">
            <p className="text-sm font-semibold text-ink">아직 스캔 기록이 없습니다.</p>
            <p className="mt-1 text-xs text-muted">
              스캐너에서 네임태그를 스캔하면 여기에 리포트가 표시됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
