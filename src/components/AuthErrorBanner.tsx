export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-md border border-danger bg-danger/10 px-3.5 py-3">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 shrink-0 text-danger"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span className="text-sm leading-relaxed text-ink">{message}</span>
    </div>
  )
}
