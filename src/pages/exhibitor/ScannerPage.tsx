import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { QRScanner } from '../../components/QRScanner'
import { fieldControlClass } from '../../components/Field'
import { useExhibitorContext, useScanPoints, useSubmitScan } from '../../features/scanner/hooks'
import type { ScanResult, ScannerScanPointType } from '../../lib/api/scanner'
import type { ScanType } from '../../types'

interface RecentEntry {
  key: string
  scannedAt: Date
  scanType: ScanType
  headCount: number
}

type ScanState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; result: ScanResult }
  | { kind: 'error'; message: string }

function fmtTime(date: Date): string {
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const AUTO_RESET_MS = 2500

export default function ScannerPage() {
  const { scanPointId } = useParams<{ scanPointId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const scanPointType = (searchParams.get('type') ?? 'BOOTH') as ScannerScanPointType
  const numericId = Number(scanPointId)

  const { data: scanPoints } = useScanPoints()
  const { data: ctx } = useExhibitorContext()
  const scanMutation = useSubmitScan()

  const [scanState, setScanState] = useState<ScanState>({ kind: 'idle' })
  const [recentScans, setRecentScans] = useState<RecentEntry[]>([])
  const [draftToken, setDraftToken] = useState('')

  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedPoint = scanPoints?.find(
    (p) => p.scanPointId === numericId && p.scanPointType === scanPointType,
  )

  const scheduleReset = useCallback(() => {
    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setScanState({ kind: 'idle' }), AUTO_RESET_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [])

  function processToken(rawToken: string) {
    const token = rawToken.trim()
    if (!token || scanState.kind !== 'idle') return

    setScanState({ kind: 'submitting' })
    scanMutation.mutate(
      { nametagToken: token, scanPointType, scanPointId: numericId },
      {
        onSuccess: (result) => {
          setScanState({ kind: 'success', result })
          setRecentScans((prev) => [
            {
              key: `${Date.now()}-${Math.random()}`,
              scannedAt: new Date(),
              scanType: result.scanType,
              headCount: result.headCount,
            },
            ...prev.slice(0, 9),
          ])
          scheduleReset()
        },
        onError: (err) => {
          const msg =
            err instanceof Error && err.message === 'UNAUTHORIZED_SCAN_POINT'
              ? '이 스캔 포인트에 접근 권한이 없습니다.'
              : '유효하지 않은 네임태그입니다. 입구 체크인이 완료된 네임태그만 사용할 수 있습니다.'
          setScanState({ kind: 'error', message: msg })
          scheduleReset()
        },
      },
    )
  }

  const isPaused = scanState.kind !== 'idle'

  return (
    <div className="flex h-screen flex-col bg-shell text-white">
      {/* 최소 헤더: 뒤로가기 + 스캔 포인트명 + 상태 칩 */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-4">
        <button
          type="button"
          onClick={() => navigate('/scanner')}
          className="flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-white"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          스캔 지점 선택
        </button>

        <span className="h-4 w-px bg-white/20" />

        {selectedPoint ? (
          <div className="flex items-center gap-2">
            <span
              className={`px-1.5 py-0.5 text-xs font-bold ${
                scanPointType === 'BOOTH' ? 'bg-primary text-white' : 'bg-accent text-ink'
              }`}
            >
              {scanPointType === 'BOOTH' ? '부스' : '세션'}
            </span>
            <span className="text-sm font-semibold text-white">{selectedPoint.displayName}</span>
          </div>
        ) : (
          <span className="text-sm text-white/55">{ctx?.exhibitionTitle ?? 'FairPilot'}</span>
        )}

        <div className="ml-auto flex items-center gap-2 bg-white/10 px-3 py-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              scanState.kind === 'submitting' ? 'bg-warning' : 'bg-live'
            }`}
          />
          <span className="text-xs font-semibold text-white/80">
            {scanState.kind === 'submitting' ? '처리 중...' : '스캔 대기중'}
          </span>
        </div>
      </div>

      {/* 메인 영역 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 카메라 + 결과 오버레이 */}
        <div className="relative flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <div className="w-full max-w-md">
            <QRScanner onScan={processToken} isPaused={isPaused} />
          </div>

          {/* 폴백 수동 입력 (카메라 없는 환경 / 테스트용) */}
          <div className="flex w-full max-w-md items-center gap-2">
            <input
              value={draftToken}
              onChange={(e) => setDraftToken(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  processToken(draftToken)
                  setDraftToken('')
                }
              }}
              placeholder="네임태그 토큰 직접 입력 (테스트: avail-1 / exit-1 / group-entry-auto-1)"
              disabled={isPaused}
              className={`${fieldControlClass} flex-1 border-white/20 bg-white/10 text-white placeholder:text-white/30 disabled:opacity-40`}
            />
            <button
              type="button"
              disabled={!draftToken.trim() || isPaused}
              onClick={() => {
                processToken(draftToken)
                setDraftToken('')
              }}
              className="shrink-0 bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              스캔
            </button>
          </div>

          {/* 결과 오버레이 */}
          {(scanState.kind === 'success' || scanState.kind === 'error') && (
            <div className="absolute inset-0 flex items-center justify-center bg-shell/85">
              {scanState.kind === 'success' && (
                <div className="flex flex-col items-center gap-5 text-center">
                  <div
                    className={`flex h-24 w-24 items-center justify-center ${
                      scanState.result.scanType === 'ENTRY' ? 'bg-success' : 'bg-primary'
                    }`}
                  >
                    <svg
                      width="52"
                      height="52"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-4xl font-black tracking-tight">
                      {scanState.result.scanType === 'ENTRY' ? 'ENTRY ✓' : 'EXIT ✓'}
                    </div>
                    {scanState.result.movementMode === 'GROUP' && (
                      <div className="mt-2 text-xl font-bold text-white/75">
                        {scanState.result.headCount}명 {scanState.result.scanType}
                      </div>
                    )}
                    {scanState.result.autoClosedPrevious && (
                      <div className="mt-4 max-w-xs bg-warning/20 px-4 py-2 text-sm leading-relaxed text-warning">
                        {scanState.result.message}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {scanState.kind === 'error' && (
                <div className="flex flex-col items-center gap-5 text-center">
                  <div className="flex h-24 w-24 items-center justify-center bg-danger">
                    <svg
                      width="52"
                      height="52"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-black">스캔 거부</div>
                    <div className="mt-2 max-w-xs text-sm leading-relaxed text-white/65">
                      {scanState.message}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 최근 스캔 패널 (이름 등 개인정보 없음 — 시각 + ENTRY/EXIT + 인원만) */}
        {recentScans.length > 0 && (
          <div className="w-52 shrink-0 overflow-y-auto border-l border-white/10 p-4">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/35">
              최근 스캔
            </div>
            <ul className="flex flex-col gap-2">
              {recentScans.map((entry) => (
                <li key={entry.key} className="flex items-center justify-between gap-2">
                  <span className="text-[11px] tabular-nums text-white/45">
                    {fmtTime(entry.scannedAt)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {entry.headCount > 1 && (
                      <span className="text-[11px] font-semibold text-white/55">
                        {entry.headCount}명
                      </span>
                    )}
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold ${
                        entry.scanType === 'ENTRY'
                          ? 'bg-success text-white'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {entry.scanType}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
