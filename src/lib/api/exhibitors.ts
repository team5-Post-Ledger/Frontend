import type { Exhibitor } from '../../types'
import { mockDelay } from './mockClient'

let MOCK_EXHIBITORS: Exhibitor[] = [
  { id: 1, exhibitionId: 1, companyName: '㈜테크노바', intro: '실시간 머신비전 및 AI 추론 솔루션을 개발합니다.', website: 'https://technova.example.com', accountUserId: 101 },
  { id: 2, exhibitionId: 1, companyName: '스마트로보㈜', intro: '협동로봇 및 자동화 라인을 공급합니다.', website: null, accountUserId: 102 },
  { id: 3, exhibitionId: 1, companyName: '클라우드웍스', intro: '엔터프라이즈 클라우드 인프라 솔루션을 제공합니다.', website: 'https://cloudworks.example.com', accountUserId: 103 },
  { id: 4, exhibitionId: 1, companyName: '데이터브릿지㈜', intro: '데이터 파이프라인 및 분석 플랫폼을 운영합니다.', website: null, accountUserId: 104 },
  { id: 5, exhibitionId: 1, companyName: '엣지센서랩', intro: 'IoT 엣지 디바이스와 센서 네트워크를 제조합니다.', website: null, accountUserId: 105 },
  // 부스는 이미 연결됐지만 EXHIBITOR 계정 발급은 아직 대기 중인 사례(account_user_id=NULL).
  { id: 6, exhibitionId: 1, companyName: '핀테크온㈜', intro: '결제·정산 API 플랫폼을 운영합니다.', website: null, accountUserId: null },
  { id: 7, exhibitionId: 3, companyName: '㈜쿡로보', intro: '조리 자동화 로봇과 무인 조리 솔루션을 개발합니다.', website: null, accountUserId: 201 },
  { id: 8, exhibitionId: 3, companyName: '프레시체인㈜', intro: '신선식품 저온유통(콜드체인) 솔루션을 제공합니다.', website: null, accountUserId: 202 },
  { id: 9, exhibitionId: 3, companyName: '대체식품랩', intro: '식물성 대체육 및 배양식품을 연구·생산합니다.', website: null, accountUserId: 203 },
  { id: 10, exhibitionId: 3, companyName: '스마트키친웍스', intro: '스마트 주방기기와 IoT 조리 디바이스를 공급합니다.', website: null, accountUserId: 204 },
  { id: 11, exhibitionId: 3, companyName: '푸드테크에이아이', intro: 'AI 기반 메뉴 추천 및 푸드 매칭 서비스를 운영합니다.', website: null, accountUserId: 205 },
  { id: 12, exhibitionId: 3, companyName: '그린패키징㈜', intro: '식품용 친환경 포장재 및 라벨을 생산합니다.', website: null, accountUserId: 206 },
  // 아래 두 건은 부스 배치 전(booth.exhibitor_id 미연결) 신규 참가기업 데모다.
  { id: 13, exhibitionId: 1, companyName: '웰니스코리아㈜', intro: '웰니스·헬스케어 디바이스를 전시 예정입니다.', website: null, accountUserId: null },
  { id: 14, exhibitionId: 1, companyName: '에듀테크플러스', intro: '교육 콘텐츠 플랫폼과 체험형 부스를 준비 중입니다.', website: 'https://edutechplus.example.com', accountUserId: 107 },
]

let nextExhibitorId = 15
let nextAccountUserId = 901

export async function getExhibitors(): Promise<Exhibitor[]> {
  return mockDelay(MOCK_EXHIBITORS)
}

// §5.2 exhibitor 컬럼 중 폼으로 입력하는 항목만. id·exhibition_id는 생성 시 정해지고, account_user_id는
// "계정 발급" 액션(issueExhibitorAccount)으로 별도 발급한다(생성과 동시에 자동 발급하지 않는다).
export type ExhibitorInput = Pick<Exhibitor, 'companyName' | 'intro' | 'website'>

export async function createExhibitor(exhibitionId: number, input: ExhibitorInput): Promise<Exhibitor> {
  const exhibitor: Exhibitor = { id: nextExhibitorId++, exhibitionId, accountUserId: null, ...input }
  MOCK_EXHIBITORS = [...MOCK_EXHIBITORS, exhibitor]
  return mockDelay(exhibitor)
}

export async function updateExhibitor(id: number, input: ExhibitorInput): Promise<Exhibitor> {
  const existing = MOCK_EXHIBITORS.find((exhibitor) => exhibitor.id === id)
  if (!existing) throw new Error('참가기업을 찾을 수 없습니다.')

  const updated: Exhibitor = { ...existing, ...input }
  MOCK_EXHIBITORS = MOCK_EXHIBITORS.map((exhibitor) => (exhibitor.id === id ? updated : exhibitor))
  return mockDelay(updated)
}

// EXHIBITOR 역할 계정 발급(§5.2 account_user_id) 목 구현. 실제로는 백엔드가 user 행을 새로 만들고
// 초대 메일을 보내지만, 지금은 가짜 user id만 채워 "발급됨" 상태로 전이시킨다.
export async function issueExhibitorAccount(id: number): Promise<Exhibitor> {
  const existing = MOCK_EXHIBITORS.find((exhibitor) => exhibitor.id === id)
  if (!existing) throw new Error('참가기업을 찾을 수 없습니다.')
  if (existing.accountUserId !== null) return mockDelay(existing)

  const updated: Exhibitor = { ...existing, accountUserId: nextAccountUserId++ }
  MOCK_EXHIBITORS = MOCK_EXHIBITORS.map((exhibitor) => (exhibitor.id === id ? updated : exhibitor))
  return mockDelay(updated)
}
