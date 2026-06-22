import type { CongestionSnapshot } from '../features/congestion/api'
import { Panel } from './Panel'
import { QueryState } from './QueryState'

export function CongestionLivePanel({
  isLoading,
  isError,
  data,
}: {
  isLoading: boolean
  isError: boolean
  data?: CongestionSnapshot
}) {
  const connected = !isLoading && !isError
  const updatedAt = data ? new Date(data.ts).toLocaleTimeString('ko-KR') : '-'

  return (
    <Panel
      title="실시간 혼잡도 (SSE)"
      subtitle={`부스/세션별 현재 인원 · ${updatedAt} 기준`}
      action={
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${connected ? 'text-accent' : 'text-muted'}`}>
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-accent' : 'bg-line'}`} />
          {connected ? '실시간 연결됨' : '연결 끊김'}
        </div>
      }
    >
      <QueryState isLoading={isLoading} isError={isError} isEmpty={data?.points.length === 0} height={88}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {data?.points.map((point) => (
            <div key={`${point.type}-${point.pointId}`} className="rounded-md bg-surface p-3">
              <div className="text-xs text-muted">{point.label}</div>
              <div className="mt-1 text-lg font-bold text-ink">
                {point.count}
                <span className="ml-1 text-xs font-medium text-muted">명</span>
              </div>
            </div>
          ))}
        </div>
      </QueryState>
    </Panel>
  )
}
