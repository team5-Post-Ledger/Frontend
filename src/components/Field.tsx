import type { ReactNode } from 'react'

export const fieldControlClass =
  'w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted'

export const fieldControlErrorClass = 'border-danger focus:border-danger focus:ring-danger/20'

export function Field({
  label,
  id,
  required,
  hint,
  error,
  children,
}: {
  label: string
  id: string
  required?: boolean
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-muted">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  )
}
