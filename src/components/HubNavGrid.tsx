import { Link } from 'react-router'
import type { ConsoleNavGroup } from './ConsoleTopBar'

interface HubNavGridProps {
  groups: ConsoleNavGroup[]
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

// 운영 허브(대시보드)의 그룹별 바로가기 버튼카드. 예전 사이드바에서 하던 탐색을
// "한 화면 버튼"으로 대체한다. 라우트 이동만 하고 데이터는 다루지 않는다.
export function HubNavGrid({ groups }: HubNavGridProps) {
  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.label}>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">{group.label}</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {group.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-center justify-between gap-2 border border-line bg-white px-4 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {item.label}
                <ArrowIcon />
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
