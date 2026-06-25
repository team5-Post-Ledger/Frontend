import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Panel } from '../../components/Panel'
import { QueryState } from '../../components/QueryState'
import { StatCard } from '../../components/StatCard'
import { useCurrentExhibition } from '../../features/exhibition/hooks'
import type { BoothFlowSummary } from '../../features/stats/api'
import { useBoothFlow } from '../../features/stats/hooks'

// 5단계 농도 버킷 — 동적으로 계산한 비율을 고정 클래스 중 하나에 매핑한다(Tailwind는 런타임에
// 조합되는 임의 값(`bg-primary/[37%]` 같은)을 빌드 타임에 인식하지 못하므로 정적 문자열만 쓴다).
const INTENSITY_CLASSES = ['bg-primary/10', 'bg-primary/20', 'bg-primary/35', 'bg-primary/50', 'bg-primary/65']

function intensityClassFor(count: number, maxCount: number): string {
  if (count === 0 || maxCount === 0) return ''
  const ratio = count / maxCount
  const bucket = Math.min(INTENSITY_CLASSES.length - 1, Math.floor(ratio * INTENSITY_CLASSES.length))
  return INTENSITY_CLASSES[bucket]
}

function buildNameMap(summary: BoothFlowSummary): Map<number, string> {
  return new Map(summary.nodes.map((node) => [node.boothId, node.name]))
}

function TransitionMatrix({ summary }: { summary: BoothFlowSummary }) {
  const maxCount = Math.max(1, ...summary.transitions.map((transition) => transition.count))
  const countOf = (fromBoothId: number, toBoothId: number) =>
    summary.transitions.find((transition) => transition.fromBoothId === fromBoothId && transition.toBoothId === toBoothId)?.count ?? 0

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-line bg-surface p-2 text-left font-semibold text-muted">From ＼ To</th>
            {summary.nodes.map((node) => (
              <th key={node.boothId} className="border border-line bg-surface p-2 font-semibold text-muted">
                {node.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {summary.nodes.map((rowNode) => (
            <tr key={rowNode.boothId}>
              <th className="border border-line bg-surface p-2 text-left font-semibold text-muted">{rowNode.name}</th>
              {summary.nodes.map((colNode) => {
                if (rowNode.boothId === colNode.boothId) {
                  return (
                    <td key={colNode.boothId} className="border border-line bg-surface p-2 text-center text-muted">
                      —
                    </td>
                  )
                }
                const count = countOf(rowNode.boothId, colNode.boothId)
                return (
                  <td
                    key={colNode.boothId}
                    className={`border border-line p-2 text-center font-semibold text-ink ${intensityClassFor(count, maxCount)}`}
                  >
                    {count > 0 ? count : '-'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TopTransitionsChart({ summary }: { summary: BoothFlowSummary }) {
  const nameById = buildNameMap(summary)
  const data = [...summary.transitions]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((transition) => ({
      label: `${nameById.get(transition.fromBoothId) ?? transition.fromBoothId} → ${nameById.get(transition.toBoothId) ?? transition.toBoothId}`,
      count: transition.count,
    }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
        <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--color-muted)' }} allowDecimals={false} />
        <YAxis type="category" dataKey="label" width={150} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} />
        <Tooltip />
        <Bar dataKey="count" name="이동 건수" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function TopRoutesList({ summary }: { summary: BoothFlowSummary }) {
  const nameById = buildNameMap(summary)
  const sorted = [...summary.topRoutes].sort((a, b) => b.count - a.count)

  return (
    <div className="flex flex-col gap-2.5">
      {sorted.map((route, index) => (
        <div key={index} className="flex items-center justify-between gap-3 border border-line p-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-ink text-[11px] font-bold text-white">{index + 1}</span>
            <span className="truncate text-sm font-semibold text-ink">{route.boothIds.map((boothId) => nameById.get(boothId) ?? boothId).join(' → ')}</span>
          </div>
          <span className="shrink-0 text-xs font-bold text-muted">{route.count.toLocaleString()}건</span>
        </div>
      ))}
    </div>
  )
}

export default function StatsFlowPage() {
  const exhibition = useCurrentExhibition()
  const exhibitionId = exhibition.data?.id ?? null
  const flow = useBoothFlow(exhibitionId)

  const autoExitRate =
    flow.data && flow.data.totalExitCount > 0 ? Math.round((flow.data.autoExitCount / flow.data.totalExitCount) * 100) : null

  if (exhibition.isError) {
    return <p className="text-sm text-danger">행사 정보를 불러오지 못했습니다.</p>
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">동선 흐름 분석</h1>
        <p className="mt-1 text-sm text-muted">부스 간 전이행렬, 대표 경로, 자동 EXIT 비율을 확인합니다.</p>
      </div>

      <QueryState
        isLoading={exhibition.isLoading || flow.isLoading}
        isError={flow.isError}
        isEmpty={!flow.data}
        emptyMessage="이 행사의 동선 데이터가 아직 없습니다."
      >
        {flow.data && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard label="분석 대상 부스">
                <div className="text-[28px] font-extrabold leading-none tracking-tight text-ink">{flow.data.nodes.length}</div>
              </StatCard>
              <StatCard label="전체 EXIT 건수">
                <div className="text-[28px] font-extrabold leading-none tracking-tight text-ink">{flow.data.totalExitCount.toLocaleString()}</div>
              </StatCard>
              <StatCard label="자동 EXIT 비율">
                {autoExitRate !== null && (
                  <>
                    <div className="flex items-baseline gap-1 text-[28px] font-extrabold leading-none tracking-tight text-ink">
                      {autoExitRate}
                      <span className="text-base font-bold">%</span>
                    </div>
                    <div className="mt-2 text-xs font-semibold text-muted">
                      자동 {flow.data.autoExitCount.toLocaleString()}건 / 전체 {flow.data.totalExitCount.toLocaleString()}건
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
                      <div className="h-full rounded-full bg-warning" style={{ width: `${autoExitRate}%` }} />
                    </div>
                  </>
                )}
              </StatCard>
            </div>

            <Panel title="부스 간 전이행렬" subtitle="행(from) → 열(to) 방향 이동 건수">
              <TransitionMatrix summary={flow.data} />
            </Panel>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
              <Panel title="전이 Top 6" subtitle="가장 빈번한 부스 간 이동">
                <TopTransitionsChart summary={flow.data} />
              </Panel>
              <Panel title="대표 경로" subtitle="자주 등장하는 방문 순서">
                <TopRoutesList summary={flow.data} />
              </Panel>
            </div>
          </div>
        )}
      </QueryState>
    </div>
  )
}
