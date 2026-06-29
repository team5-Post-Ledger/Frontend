import type { ReactNode } from 'react'

interface Props {
  code?: string
  title: string
  message: string
  actions: ReactNode
}

export function SystemPageShell({ code, title, message, actions }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 py-12">
      <div className="w-full max-w-sm text-center">
        {code && (
          <div className="mb-4 font-mono text-7xl font-extrabold tracking-tight text-line">
            {code}
          </div>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <div className="mt-8 flex flex-col items-stretch gap-2">{actions}</div>
      </div>
    </div>
  )
}
