import { mockDelay } from '../../lib/api/mockClient'

export type CongestionLevel = '여유' | '보통' | '혼잡'

/** 서버 CongestionLevel과 동일한 4단계(§3.3). 화면 표시는 여유/보통/혼잡/포화로 매핑한다. */
export type CongestionPointLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'FULL'

export interface CongestionPoint {
  type: 'BOOTH' | 'SESSION'
  pointId: number
  label: string
  count: number
  level: CongestionPointLevel
}

export interface CongestionSnapshot {
  level: CongestionLevel
  points: CongestionPoint[]
  ts: string
}

// 서버 기본 임계값(level-medium:30, level-high:60, level-full:100, spec.md §0.1)과 동일한 기준으로
// count로부터 level을 파생시킨다 — jitter로 count가 흔들려도 level이 항상 그 count와 일치하게 한다.
function deriveLevel(count: number): CongestionPointLevel {
  if (count >= 100) return 'FULL'
  if (count >= 60) return 'HIGH'
  if (count >= 30) return 'MEDIUM'
  return 'LOW'
}

interface CongestionPointSeed {
  type: 'BOOTH' | 'SESSION'
  pointId: number
  label: string
  count: number
}

// exhibitionId=1의 실제 booth id는 1~12(lib/api/booths.ts). 부스 12개 중 11개(1~11)에 포인트를
// 부여하고, 12번은 의도적으로 비워서 "데이터 없음" 폴백을 검증한다.
const EXHIBITION_1_POINTS: CongestionPointSeed[] = [
  { type: 'BOOTH', pointId: 1, label: '테크노바 · AI 솔루션', count: 15 },
  { type: 'BOOTH', pointId: 2, label: '스마트로보 부스', count: 34 },
  { type: 'BOOTH', pointId: 3, label: '클라우드웍스', count: 72 },
  { type: 'BOOTH', pointId: 4, label: '데이터브릿지', count: 8 },
  { type: 'BOOTH', pointId: 5, label: '엣지센서랩', count: 45 },
  { type: 'BOOTH', pointId: 6, label: '핀테크온', count: 110 },
  { type: 'BOOTH', pointId: 7, label: '스마트로보 · 협동로봇 라이브쇼', count: 22 },
  { type: 'BOOTH', pointId: 8, label: '클라우드웍스 · 멀티클라우드 존', count: 58 },
  { type: 'BOOTH', pointId: 9, label: '엣지센서랩 · 스마트팩토리 센서', count: 91 },
  { type: 'BOOTH', pointId: 10, label: '핀테크온 · QR 결제 체험존', count: 12 },
  { type: 'BOOTH', pointId: 11, label: '데이터브릿지 · 라운지', count: 38 },
  { type: 'SESSION', pointId: 4, label: '세미나 B', count: 52 },
]

// exhibitionId=3의 실제 booth id는 13~19(7개). 6개(13~18)에 포인트, 19번은 비워둔다.
const EXHIBITION_3_POINTS: CongestionPointSeed[] = [
  { type: 'BOOTH', pointId: 13, label: '쿡로보 · 무인 조리 로봇존', count: 18 },
  { type: 'BOOTH', pointId: 14, label: '프레시체인 · 콜드체인 솔루션', count: 42 },
  { type: 'BOOTH', pointId: 15, label: '대체식품랩 · 플랜트베이스 테이스팅', count: 65 },
  { type: 'BOOTH', pointId: 16, label: '스마트키친웍스 · IoT 키친 쇼룸', count: 5 },
  { type: 'BOOTH', pointId: 17, label: '푸드테크AI · 메뉴 추천 데모', count: 95 },
  { type: 'BOOTH', pointId: 18, label: '그린패키징 · 친환경 포장재 존', count: 120 },
  { type: 'SESSION', pointId: 11, label: 'Food Tech Stage', count: 31 },
]

const POINTS_BY_EXHIBITION_ID: Record<number, CongestionPointSeed[]> = {
  1: EXHIBITION_1_POINTS,
  3: EXHIBITION_3_POINTS,
}

export async function getCongestionLive(exhibitionId?: number): Promise<CongestionSnapshot> {
  const jitter = () => Math.floor(Math.random() * 7) - 3
  const seeds = exhibitionId === undefined ? EXHIBITION_1_POINTS : POINTS_BY_EXHIBITION_ID[exhibitionId] ?? []

  return mockDelay(
    {
      level: '보통',
      points: seeds.map((seed) => {
        const count = Math.max(0, seed.count + jitter())
        return { ...seed, count, level: deriveLevel(count) }
      }),
      ts: new Date().toISOString(),
    },
    250,
  )
}
