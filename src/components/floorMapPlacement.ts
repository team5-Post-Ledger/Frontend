import type { FloorMapBooth } from './FloorMap'

export interface FloorMapPlacement {
  leftPct: number
  topPct: number
  widthPct: number
  heightPct: number
}

// 좌표 min/max 정규화 대신, 그 층 부스들의 x+width/y+height 최댓값을 도면 크기로 삼는다
// (task-floor-map/spec.md §2.1) — authored 데이터엔 항상 폭/높이가 있어서 "축 값이 전부 같음"
// edge case가 애초에 생기지 않는다.
// FloorMap.tsx와 별도 파일인 이유: react-refresh(fast refresh)는 컴포넌트 파일이 컴포넌트가 아닌
// 값(함수 등)을 export하는 걸 금지한다 — 이 계산을 페이지(혼잡도 번짐 오버레이, task-map-fix/spec.md
// §2.1)에서도 재사용해야 해서 순수 유틸로 분리했다.
export function computeFloorPlacements(booths: FloorMapBooth[]): Map<number, FloorMapPlacement> {
  const placements = new Map<number, FloorMapPlacement>()
  if (booths.length === 0) return placements

  const maxExtentX = Math.max(...booths.map((booth) => booth.x + booth.width))
  const maxExtentY = Math.max(...booths.map((booth) => booth.y + booth.height))

  for (const booth of booths) {
    placements.set(booth.boothId, {
      leftPct: (booth.x / maxExtentX) * 100,
      topPct: (booth.y / maxExtentY) * 100,
      widthPct: (booth.width / maxExtentX) * 100,
      heightPct: (booth.height / maxExtentY) * 100,
    })
  }
  return placements
}
