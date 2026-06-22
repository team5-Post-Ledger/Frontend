import { mockDelay } from '../../lib/api/mockClient'

export type CongestionLevel = '여유' | '보통' | '혼잡'

export interface CongestionPoint {
  type: 'BOOTH' | 'SESSION'
  pointId: number
  label: string
  count: number
}

export interface CongestionSnapshot {
  level: CongestionLevel
  points: CongestionPoint[]
  ts: string
}

const BASE_POINTS: CongestionPoint[] = [
  { type: 'BOOTH', pointId: 12, label: 'AI Factory', count: 38 },
  { type: 'BOOTH', pointId: 31, label: '그린팩', count: 24 },
  { type: 'BOOTH', pointId: 8, label: '스마트로보틱스', count: 19 },
  { type: 'SESSION', pointId: 4, label: '세미나 B', count: 52 },
]

export async function getCongestionLive(): Promise<CongestionSnapshot> {
  const jitter = () => Math.floor(Math.random() * 7) - 3

  return mockDelay(
    {
      level: '보통',
      points: BASE_POINTS.map((point) => ({ ...point, count: Math.max(0, point.count + jitter()) })),
      ts: new Date().toISOString(),
    },
    250,
  )
}
