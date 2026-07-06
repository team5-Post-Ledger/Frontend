import { Link } from 'react-router'
import type { ConsoleNavItem } from './ConsoleTopBar'

interface HubNavGridProps {
  items: ConsoleNavItem[]
}

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted transition-colors group-hover:text-primary"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

// 운영 허브(대시보드)의 슬림 바로가기 한 줄. 상단바가 전체 네비를 담당하므로
// 여기서는 더보기에 숨은 마스터 항목만 카드로 노출한다(그룹 헤더 없이 flat).
export function HubNavGrid({ items }: HubNavGridProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="group flex min-w-[130px] flex-1 items-center justify-between gap-2 border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {item.label}
          <ArrowIcon />
        </Link>
      ))}
    </div>
  )
}
