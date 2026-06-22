import type { ReactNode } from 'react'

export function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[15px] font-bold text-ink">{title}</div>
          {subtitle && <div className="mt-0.5 text-xs text-muted">{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}
