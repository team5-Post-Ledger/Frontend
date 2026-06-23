import { Html5Qrcode } from 'html5-qrcode'
import { useEffect, useId, useRef, useState } from 'react'

type ScannerStatus = 'starting' | 'scanning' | 'no-camera' | 'denied'

export function QRScanner({
  onScan,
  isPaused = false,
  scanCooldownMs = 1500,
  className,
}: {
  onScan: (decodedText: string) => void
  isPaused?: boolean
  scanCooldownMs?: number
  className?: string
}) {
  const elementId = `qr-scanner-${useId().replace(/:/g, '')}`
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const pausedRef = useRef(false)
  const lastScanRef = useRef<{ text: string; at: number } | null>(null)
  const onScanRef = useRef(onScan)
  const [status, setStatus] = useState<ScannerStatus>('starting')

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    let isCancelled = false
    const scanner = new Html5Qrcode(elementId)
    scannerRef.current = scanner

    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (isCancelled) return undefined
        if (cameras.length === 0) {
          setStatus('no-camera')
          return undefined
        }
        const cameraId = cameras[cameras.length - 1].id
        return scanner.start(
          cameraId,
          { fps: 10, qrbox: 250 },
          (decodedText) => {
            const now = Date.now()
            const last = lastScanRef.current
            if (last && last.text === decodedText && now - last.at < scanCooldownMs) return
            lastScanRef.current = { text: decodedText, at: now }
            onScanRef.current(decodedText)
          },
          undefined,
        )
      })
      .then(() => {
        if (!isCancelled) setStatus('scanning')
      })
      .catch(() => {
        if (!isCancelled) setStatus('denied')
      })

    return () => {
      isCancelled = true
      if (scanner.isScanning) {
        scanner
          .stop()
          .catch(() => {})
          .finally(() => scanner.clear())
      }
    }
  }, [elementId, scanCooldownMs])

  useEffect(() => {
    const scanner = scannerRef.current
    if (!scanner || status !== 'scanning') return

    try {
      if (isPaused && !pausedRef.current) {
        scanner.pause(true)
        pausedRef.current = true
      } else if (!isPaused && pausedRef.current) {
        scanner.resume()
        pausedRef.current = false
      }
    } catch {
      // 카메라 시작 직후 상태 전환이 끝나지 않은 경우 — 다음 렌더에서 재시도된다
    }
  }, [isPaused, status])

  return (
    <div className={className}>
      <div id={elementId} className="overflow-hidden rounded-lg border border-line bg-shell [&_video]:w-full" />
      {status === 'starting' && <p className="mt-2 text-center text-sm text-muted">카메라를 불러오는 중...</p>}
      {status === 'no-camera' && <p className="mt-2 text-center text-sm text-danger">사용 가능한 카메라가 없습니다.</p>}
      {status === 'denied' && <p className="mt-2 text-center text-sm text-danger">카메라 접근 권한을 확인해주세요.</p>}
      {status === 'scanning' && isPaused && <p className="mt-2 text-center text-sm text-muted">스캔이 일시정지되었습니다.</p>}
    </div>
  )
}
