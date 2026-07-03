import type { CSSProperties, ReactNode } from 'react'
import { useMemo } from 'react'

export interface FloorMapBooth {
  boothId: number
  name: string
  /** 아래 4개는 authored 가상 그리드 단위(spec.md §0.4), 왼쪽 위 기준 — Booth.posX/posY가 아니다. */
  x: number
  y: number
  width: number
  height: number
}

export interface FloorMapConnection {
  fromBoothId: number
  toBoothId: number
}

export interface FloorMapProps {
  booths: FloorMapBooth[]
  renderBox: (booth: FloorMapBooth) => ReactNode
  boxClassName?: (booth: FloorMapBooth) => string
  onBoxClick?: (boothId: number) => void
  connections?: FloorMapConnection[]
}

interface Placement {
  leftPct: number
  topPct: number
  widthPct: number
  heightPct: number
}

// 좌표 min/max 정규화 대신, 그 층 부스들의 x+width/y+height 최댓값을 도면 크기로 삼는다
// (spec.md §2.1) — authored 데이터엔 항상 폭/높이가 있어서 "축 값이 전부 같음" edge case가
// 애초에 생기지 않는다.
function computePlacements(booths: FloorMapBooth[]): Map<number, Placement> {
  const placements = new Map<number, Placement>()
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

export function FloorMap({ booths, renderBox, boxClassName, onBoxClick, connections }: FloorMapProps) {
  const placements = useMemo(() => computePlacements(booths), [booths])

  if (booths.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted">
        이 층에는 부스가 없습니다.
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      {connections && connections.length > 0 && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {connections.map((connection) => {
            const from = placements.get(connection.fromBoothId)
            const to = placements.get(connection.toBoothId)
            if (!from || !to) return null

            const fromCenter = { x: from.leftPct + from.widthPct / 2, y: from.topPct + from.heightPct / 2 }
            const toCenter = { x: to.leftPct + to.widthPct / 2, y: to.topPct + to.heightPct / 2 }

            // 엘보(직각) 연결: 가로 이동 먼저(from → to의 x, from의 y) → 세로 이동(to의 y)(spec.md §2.2).
            const points = `${fromCenter.x},${fromCenter.y} ${toCenter.x},${fromCenter.y} ${toCenter.x},${toCenter.y}`
            return (
              <polyline
                key={`${connection.fromBoothId}-${connection.toBoothId}`}
                points={points}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
        </svg>
      )}

      {booths.map((booth) => {
        const placement = placements.get(booth.boothId)
        if (!placement) return null

        const style: CSSProperties = {
          left: `${placement.leftPct}%`,
          top: `${placement.topPct}%`,
          width: `${placement.widthPct}%`,
          height: `${placement.heightPct}%`,
        }
        // 테두리는 FloorMap 기본 스타일 — boxClassName은 배경/텍스트색만 얹는다(spec.md §2).
        const className = `absolute flex items-center justify-center overflow-hidden border-2 border-ink/70 ${boxClassName?.(booth) ?? ''}`

        // onBoxClick이 주어졌을 때만 포커스 가능한 버튼으로 렌더링한다 — 클릭할 게 없는 박스를
        // 키보드 탭 순서에 끼워 넣지 않는다(spec.md §2 키보드 포커스 규칙).
        if (onBoxClick) {
          return (
            <button
              key={booth.boothId}
              type="button"
              onClick={() => onBoxClick(booth.boothId)}
              style={style}
              className={`${className} outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40`}
            >
              {renderBox(booth)}
            </button>
          )
        }

        return (
          <div key={booth.boothId} style={style} className={className}>
            {renderBox(booth)}
          </div>
        )
      })}
    </div>
  )
}
