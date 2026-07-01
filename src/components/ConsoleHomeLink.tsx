import { Link } from 'react-router'

export function ConsoleHomeLink() {
  return (
    <Link
      to="/"
      className="mb-3 flex items-center gap-1 text-xs font-semibold text-white/45 transition-colors hover:text-white/80"
    >
      ← 메인 사이트
    </Link>
  )
}
