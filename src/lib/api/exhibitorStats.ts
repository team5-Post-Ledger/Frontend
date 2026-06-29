import type { ScannerScanPointType } from './scanner'
import { mockDelay } from './mockClient'

export interface ExhibitorPointStatsHourly {
  statHour: number
  visitorCount: number
}

export interface DwellBucket {
  bucketLabel: string  // "~5분", "~10분", "~20분", "~30분", "30분+"
  count: number
}

// stat_visit_point 컬럼 기반 최소 필드
// avgDwellSec = SUM(sum_dwell_sec)/SUM(dwell_count) 로 사전 계산 (단순 평균 금지)
// BOOTH 전용 확장 필드(optional):
//   autoExitRatio = visit_log.is_auto_exit COUNT / 전체 EXIT 건수
//   dwellDistribution = visit_dwell.dwell_seconds 버킷 카운트 (체류시간 분포)
export interface ExhibitorPointStats {
  visitCount: number
  visitorCount: number     // head_count 합 = 실제 인원 (GROUP 가중)
  uniqueAttendee: number   // distinct attendee = 태그 수 (GROUP 대표 1)
  avgDwellSec: number      // SUM(sum_dwell_sec)/SUM(dwell_count)
  hourly: ExhibitorPointStatsHourly[]
  autoExitRatio?: number       // BOOTH 전용. 0~1
  dwellDistribution?: DwellBucket[]  // BOOTH 전용
}

const EMPTY_STATS: ExhibitorPointStats = {
  visitCount: 0,
  visitorCount: 0,
  uniqueAttendee: 0,
  avgDwellSec: 0,
  hourly: [],
}

// 시드 규칙:
//   BOOTH-142 (삼성 SDI): GROUP 섞여 visitorCount(142) > uniqueAttendee(98). avgDwellSec = SUM(112632)/SUM(104) = 1083
//                          autoExitRatio=0.34 (높음 — EXIT 스캔 누락 경고)
//   BOOTH-143 (SK이노):   INDIVIDUAL 주. autoExitRatio=0.09 (낮음 — 양호)
//   BOOTH-144 (LG에너지): 빈 상태 — 스캔 0건
//   SESSION-201/202:      autoExitRatio·dwellDistribution 없음(BOOTH 전용)
const MOCK_STATS: Record<string, ExhibitorPointStats> = {
  'BOOTH-142': {
    visitCount: 156,
    visitorCount: 142,
    uniqueAttendee: 98,
    avgDwellSec: 1083,
    hourly: [
      { statHour: 9,  visitorCount: 8  },
      { statHour: 10, visitorCount: 18 },
      { statHour: 11, visitorCount: 27 },
      { statHour: 12, visitorCount: 22 },
      { statHour: 13, visitorCount: 31 },
      { statHour: 14, visitorCount: 19 },
      { statHour: 15, visitorCount: 11 },
      { statHour: 16, visitorCount: 6  },
    ],
    autoExitRatio: 0.34,
    dwellDistribution: [
      { bucketLabel: '~5분',  count: 8  },
      { bucketLabel: '~10분', count: 22 },
      { bucketLabel: '~20분', count: 38 },
      { bucketLabel: '~30분', count: 19 },
      { bucketLabel: '30분+', count: 11 },
    ],
  },
  'BOOTH-143': {
    visitCount: 89,
    visitorCount: 87,
    uniqueAttendee: 85,
    avgDwellSec: 742,
    hourly: [
      { statHour: 10, visitorCount: 12 },
      { statHour: 11, visitorCount: 19 },
      { statHour: 12, visitorCount: 14 },
      { statHour: 13, visitorCount: 21 },
      { statHour: 14, visitorCount: 15 },
      { statHour: 15, visitorCount: 6  },
    ],
    autoExitRatio: 0.09,
    dwellDistribution: [
      { bucketLabel: '~5분',  count: 12 },
      { bucketLabel: '~10분', count: 28 },
      { bucketLabel: '~20분', count: 31 },
      { bucketLabel: '~30분', count: 12 },
      { bucketLabel: '30분+', count: 4  },
    ],
  },
  'BOOTH-144': {
    visitCount: 0,
    visitorCount: 0,
    uniqueAttendee: 0,
    avgDwellSec: 0,
    hourly: [],
    autoExitRatio: 0,
    dwellDistribution: [],
  },
  'SESSION-201': {
    visitCount: 63,
    visitorCount: 61,
    uniqueAttendee: 60,
    avgDwellSec: 2640,
    hourly: [
      { statHour: 11, visitorCount: 28 },
      { statHour: 14, visitorCount: 33 },
    ],
  },
  'SESSION-202': {
    visitCount: 44,
    visitorCount: 42,
    uniqueAttendee: 42,
    avgDwellSec: 3120,
    hourly: [
      { statHour: 10, visitorCount: 20 },
      { statHour: 15, visitorCount: 22 },
    ],
  },
}

// GET /api/exhibitor/booths/{boothId}/stats 대응
// scanPointType/scanPointId 기반 지점별 리포트 (회사 집계 엔드포인트 없음)
export async function getExhibitorPointStats(params: {
  scanPointType: ScannerScanPointType
  scanPointId: number
}): Promise<ExhibitorPointStats> {
  const key = `${params.scanPointType}-${params.scanPointId}`
  return mockDelay(MOCK_STATS[key] ?? EMPTY_STATS, 450)
}
