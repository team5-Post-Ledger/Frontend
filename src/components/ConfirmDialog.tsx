import { useEffect, useId, useRef } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  variant?: 'default' | 'destructive'
  isPending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    cancelButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isPending) {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isPending, onCancel, open])

  if (!open) {
    return null
  }

  const confirmClassName =
    variant === 'destructive'
      ? 'bg-danger text-white hover:bg-danger/90 focus-visible:outline-danger'
      : 'bg-primary text-white hover:bg-primary-hover focus-visible:outline-primary'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-shell/55 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) {
          onCancel()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-md border border-line bg-white p-5 text-ink shadow-lg"
      >
        <div className="space-y-2">
          <h2 id={titleId} className="text-lg font-extrabold text-ink">
            {title}
          </h2>
          <p id={descriptionId} className="whitespace-pre-line text-sm leading-6 text-muted">
            {description}
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelButtonRef}
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className="px-4 py-2 text-sm font-bold text-muted ring-1 ring-line transition-colors hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className={[
              'px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55',
              confirmClassName,
            ].join(' ')}
          >
            {isPending ? '처리 중' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
