import type { MovementMode, ScanType } from '../../types'

export type ScannerScanPointType = 'BOOTH' | 'SESSION'

// getScanPoints 응답: master-plan §6.5 "최소 필드만"
export interface ScanPoint {
  scanPointType: ScannerScanPointType
  scanPointId: number
  displayName: string // booth.name 또는 session.title
}

// submitScan 응답: §6.5 예시 그대로 (이름 등 개인정보 없음 — §7.7)
export interface ScanResult {
  attendeeId: number
  movementMode: MovementMode
  headCount: number
  scanType: ScanType
  autoClosedPrevious: boolean
  message: string
}

export interface ExhibitorContext {
  exhibitionTitle: string
}

const DELAY = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

// 목 시드: BOOTH 3개 + SESSION 2개
const MOCK_SCAN_POINTS: ScanPoint[] = [
  { scanPointType: 'BOOTH', scanPointId: 142, displayName: 'E-23 · 삼성 SDI 부스' },
  { scanPointType: 'BOOTH', scanPointId: 143, displayName: 'E-24 · SK이노베이션 부스' },
  { scanPointType: 'BOOTH', scanPointId: 144, displayName: 'E-25 · LG에너지솔루션 부스' },
  { scanPointType: 'SESSION', scanPointId: 201, displayName: '배터리 미래 세미나' },
  { scanPointType: 'SESSION', scanPointId: 202, displayName: 'ESG 경영 전략 세션' },
]

export async function getScanPoints(): Promise<ScanPoint[]> {
  await DELAY(400)
  return MOCK_SCAN_POINTS
}

export async function getExhibitorContext(): Promise<ExhibitorContext> {
  await DELAY(200)
  return { exhibitionTitle: '서울 스마트테크 엑스포 2026' }
}

/**
 * 목 시드 케이스 (nametagToken 접두사로 구분):
 *   avail-*        → INVALID_NAMETAG (AVAILABLE 미바인딩 거부)
 *   revoke-*       → INVALID_NAMETAG (REVOKED 거부)
 *   unauth-*       → UNAUTHORIZED_SCAN_POINT (권한 없는 scan point)
 *   group-entry-auto-* → GROUP ENTRY + autoClosedPrevious=true
 *   group-exit-*   → GROUP EXIT
 *   exit-*         → INDIVIDUAL EXIT
 *   (그 외)        → INDIVIDUAL ENTRY (기본)
 */
export async function submitScan(params: {
  nametagToken: string
  scanPointType: ScannerScanPointType
  scanPointId: number
}): Promise<ScanResult> {
  await DELAY(600)
  const t = params.nametagToken.toLowerCase().trim()

  if (t.startsWith('avail-')) throw new Error('INVALID_NAMETAG')
  if (t.startsWith('revoke-')) throw new Error('INVALID_NAMETAG')
  if (t.startsWith('unauth-')) throw new Error('UNAUTHORIZED_SCAN_POINT')

  if (t.startsWith('group-entry-auto')) {
    return {
      attendeeId: 301,
      movementMode: 'GROUP',
      headCount: 25,
      scanType: 'ENTRY',
      autoClosedPrevious: true,
      message: '이전 부스 미종결 체류를 자동 종료하고 현재 부스 ENTRY를 기록했습니다.',
    }
  }
  if (t.startsWith('group-exit')) {
    return {
      attendeeId: 301,
      movementMode: 'GROUP',
      headCount: 25,
      scanType: 'EXIT',
      autoClosedPrevious: false,
      message: '단체 25명 EXIT 기록됐습니다.',
    }
  }
  if (t.startsWith('exit-')) {
    return {
      attendeeId: 102,
      movementMode: 'INDIVIDUAL',
      headCount: 1,
      scanType: 'EXIT',
      autoClosedPrevious: false,
      message: 'EXIT 기록됐습니다.',
    }
  }

  return {
    attendeeId: 101,
    movementMode: 'INDIVIDUAL',
    headCount: 1,
    scanType: 'ENTRY',
    autoClosedPrevious: false,
    message: 'ENTRY 기록됐습니다.',
  }
}
