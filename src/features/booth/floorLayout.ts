// 부스 도면 표시 전용 mock 데이터(authored, spec.md §0.4). `Booth` 엔티티 필드가 아니라
// boothId로 조인하는 완전히 별도의 데이터셋 — 실제 계측값이 아니라 지도를 보기 좋게
// 그리기 위해 직접 배치한 값이다. 가상 그리드 단위, 층마다 별도 FloorMap으로 그려지므로
// 층이 다른 부스끼리 좌표가 겹쳐도 무관하다.
export interface BoothFootprint {
  x: number
  y: number
  width: number
  height: number
}

export const BOOTH_FLOOR_LAYOUT: Record<number, BoothFootprint> = {
  // 전시1(exhibitionId=1) 1층 — 대형 1 + 소형 2, 2줄
  1: { x: 2, y: 1, width: 5, height: 5 },
  2: { x: 8, y: 1, width: 3, height: 4 },
  7: { x: 12, y: 1, width: 3, height: 4 },
  3: { x: 2, y: 7, width: 3, height: 4 },
  8: { x: 6, y: 7, width: 3, height: 4 },
  // 전시1 2층
  4: { x: 2, y: 1, width: 5, height: 5 },
  5: { x: 8, y: 1, width: 3, height: 4 },
  6: { x: 12, y: 1, width: 3, height: 4 },
  9: { x: 2, y: 7, width: 3, height: 4 },
  10: { x: 6, y: 7, width: 3, height: 4 },
  // 전시1 3층 — 부스 2개뿐, 중형 2개 나란히
  11: { x: 3, y: 2, width: 4, height: 4 },
  12: { x: 9, y: 2, width: 4, height: 4 },
  // 전시3(exhibitionId=3) 1층
  13: { x: 2, y: 1, width: 5, height: 5 },
  14: { x: 8, y: 1, width: 3, height: 4 },
  15: { x: 12, y: 1, width: 3, height: 4 },
  // 전시3 2층
  16: { x: 2, y: 1, width: 5, height: 5 },
  17: { x: 8, y: 1, width: 3, height: 4 },
  18: { x: 12, y: 1, width: 3, height: 4 },
  // 전시3 3층 — 부스 1개뿐
  19: { x: 5, y: 2, width: 5, height: 5 },
}

export function getBoothFootprint(boothId: number): BoothFootprint | undefined {
  return BOOTH_FLOOR_LAYOUT[boothId]
}
