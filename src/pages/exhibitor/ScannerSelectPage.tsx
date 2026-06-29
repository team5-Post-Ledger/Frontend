import { useNavigate } from 'react-router'
import { QueryState } from '../../components/QueryState'
import { useScanPoints } from '../../features/scanner/hooks'
import type { ScannerScanPointType } from '../../lib/api/scanner'

export default function ScannerSelectPage() {
  const navigate = useNavigate()
  const query = useScanPoints()

  function handleSelect(scanPointId: number, scanPointType: ScannerScanPointType) {
    navigate(`/scanner/${scanPointId}?type=${scanPointType}`)
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-8">
      <h1 className="mb-1 text-xl font-extrabold tracking-tight text-ink">스캔 지점 선택</h1>
      <p className="mb-6 text-sm text-muted">스캔을 시작할 부스 또는 세션을 선택하세요.</p>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={query.data?.length === 0}
        emptyMessage="등록된 스캔 지점이 없습니다."
      >
        <ul className="flex flex-col gap-3">
          {query.data?.map((point) => (
            <li key={`${point.scanPointType}-${point.scanPointId}`}>
              <button
                type="button"
                onClick={() => handleSelect(point.scanPointId, point.scanPointType)}
                className="flex w-full items-center gap-4 border border-line bg-white px-5 py-4 text-left transition-colors hover:bg-surface"
              >
                <span
                  className={`shrink-0 px-2 py-0.5 text-xs font-bold ${
                    point.scanPointType === 'BOOTH' ? 'bg-primary text-white' : 'bg-accent text-ink'
                  }`}
                >
                  {point.scanPointType === 'BOOTH' ? '부스' : '세션'}
                </span>
                <span className="flex-1 text-sm font-semibold text-ink">{point.displayName}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-muted"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </QueryState>
    </div>
  )
}
