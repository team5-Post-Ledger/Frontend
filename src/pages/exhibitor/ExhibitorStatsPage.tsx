import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router'
import { Panel } from '../../components/Panel'
import { QueryState } from '../../components/QueryState'
import { StatCard } from '../../components/StatCard'
import { useExhibitorPointStats } from '../../features/exhibitorStats/hooks'
import { useExhibitorContext, useScanPoints } from '../../features/scanner/hooks'
import type { ScanPoint } from '../../lib/api/scanner'

function formatDwellSec(sec: number) {
  if (sec === 0) return '-'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s > 0 ? `${m}분 ${s}초` : `${m}분`
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

// 스캔 지점 선택 탭 (지점이 2개 이상일 때만 렌더)
function ScanPointSelector({
  points,
  selected,
  onSelect,
}: {
  points: ScanPoint[]
  selected: ScanPoint
  onSelect: (p: ScanPoint) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {points.map((p) => {
        const active = p.scanPointType === selected.scanPointType && p.scanPointId === selected.scanPointId
        return (
          <button
            key={`${p.scanPointType}-${p.scanPointId}`}
            type="button"
            onClick={() => onSelect(p)}
            className={[
              'flex items-center gap-2 border px-3 py-1.5 text-sm font-semibold transition-colors',
              active
                ? 'border-primary bg-primary text-white'
                : 'border-line bg-white text-ink hover:border-primary hover:text-primary',
            ].join(' ')}
          >
            <span className="text-[10px] font-bold uppercase text-current opacity-60">
              {p.scanPointType === 'BOOTH' ? 'B' : 'S'}
            </span>
            {p.displayName}
          </button>
        )
      })}
    </div>
  )
}

export default function ExhibitorStatsPage() {
  const scanPointsQuery = useScanPoints()
  const contextQuery = useExhibitorContext()

  const points = scanPointsQuery.data ?? []
  const [selectedPoint, setSelectedPoint] = useState<ScanPoint | null>(null)

  // 지점이 로드되면 첫 번째를 기본 선택
  const activePoint = selectedPoint ?? (points.length > 0 ? points[0] : null)

  const statsQuery = useExhibitorPointStats(
    activePoint
      ? { scanPointType: activePoint.scanPointType, scanPointId: activePoint.scanPointId }
      : null,
  )

  const stats = statsQuery.data
  const isEmpty = stats !== undefined && stats.visitCount === 0

  const chartData = (stats?.hourly ?? []).map((h) => ({
    label: `${h.statHour}시`,
    visitorCount: h.visitorCount,
  }))

  return (
    <div className="min-h-screen bg-surface">
      {/* 페이지 상단 컨텍스트 바 */}
      <div className="border-b border-line bg-white px-4 py-4 sm:px-6">
        <QueryState
          isLoading={contextQuery.isLoading}
          isError={contextQuery.isError}
          height={24}
        >
          <p className="text-xs text-muted">
            {contextQuery.data?.exhibitionTitle ?? ''}
          </p>
        </QueryState>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-xl font-extrabold tracking-tight text-ink">
            {activePoint ? `${activePoint.displayName} 리포트` : '방문자 리포트'}
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            <span className="border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted">
              오늘
            </span>
            {/* BOOTH 지점에만 부스 상세 진입 CTA — SESSION은 상세 라우트 없음 */}
            {activePoint?.scanPointType === 'BOOTH' && (
              <Link
                to={`/exhibitor/stats/booths/${activePoint.scanPointId}`}
                className="border border-primary px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
              >
                부스 상세 →
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-5 sm:px-6">
        {/* 스캔 지점 셀렉터 (2개 이상일 때) */}
        {scanPointsQuery.isLoading ? (
          <p className="mb-4 text-sm text-muted">스캔 지점 불러오는 중...</p>
        ) : scanPointsQuery.isError ? (
          <p className="mb-4 text-sm text-danger">스캔 지점를 불러오지 못했습니다.</p>
        ) : points.length > 1 && activePoint ? (
          <div className="mb-5">
            <ScanPointSelector
              points={points}
              selected={activePoint}
              onSelect={setSelectedPoint}
            />
          </div>
        ) : null}

        {/* KPI 카드 4종 */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {/* 방문 인원 — visitorCount (head_count 합, GROUP 가중 실제 인원) */}
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
                  <p className="mt-2 text-xs text-white/40">
                    GROUP 가중 실제 방문 인원
                  </p>
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

          {/* 평균 체류시간 — avgDwellSec (SUM/SUM 사전 계산) */}
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

        {/* 시간대별 방문 현황 차트 */}
        <div className="mt-4">
          <Panel title="시간대별 방문 인원" subtitle="visitorCount · stat_visit_point 기준">
            <QueryState
              isLoading={statsQuery.isLoading}
              isError={statsQuery.isError}
              isEmpty={isEmpty || chartData.length === 0}
              emptyMessage="시간대 데이터가 없습니다."
              height={200}
            >
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
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

        {/* 빈 상태 안내 (스캔 0건 지점) */}
        {isEmpty && (
          <div className="mt-4 border border-line bg-white p-5 text-center">
            <p className="text-sm font-semibold text-ink">아직 스캔 기록이 없습니다.</p>
            <p className="mt-1 text-xs text-muted">스캐너에서 네임태그를 스캔하면 여기에 리포트가 표시됩니다.</p>
          </div>
        )}

        {/* 인원·태그수 차이 안내 */}
        {stats && stats.visitorCount > stats.uniqueAttendee && (
          <div className="mt-4 border border-line bg-white p-4">
            <p className="text-xs font-semibold text-ink">방문 인원({stats.visitorCount}명) &gt; 태그 수({stats.uniqueAttendee}명)</p>
            <p className="mt-1 text-xs text-muted">
              GROUP 단체 방문이 포함돼 head_count 가중 인원이 distinct 태그 수보다 많습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
