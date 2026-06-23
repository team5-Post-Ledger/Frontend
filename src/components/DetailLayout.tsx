import type { ReactNode } from 'react'

export interface DetailAttribute {
  label: string
  value: ReactNode
}

export function DetailLayout({
  title,
  subtitle,
  badge,
  actions,
  attributes,
  children,
}: {
  title: string
  subtitle?: string
  badge?: ReactNode
  actions?: ReactNode
  attributes?: DetailAttribute[]
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold tracking-tight text-ink">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {attributes && attributes.length > 0 && (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 rounded-lg border border-line bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
          {attributes.map((attribute) => (
            <div key={attribute.label}>
              <dt className="text-xs font-semibold text-muted">{attribute.label}</dt>
              <dd className="mt-1 text-sm font-medium text-ink">{attribute.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {children && <div className="flex flex-col gap-4">{children}</div>}
    </div>
  )
}
