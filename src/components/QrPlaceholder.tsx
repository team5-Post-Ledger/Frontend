export function QrPlaceholder({ token, size = 72 }: { token: string | null; size?: number }) {
  if (!token) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center border border-dashed border-line bg-surface text-center"
      >
        <span className="px-1 text-[9px] leading-tight text-muted">발급 전</span>
      </div>
    )
  }

  return (
    <div style={{ width: size, height: size }} className="flex shrink-0 flex-col items-center justify-center gap-1 border border-dashed border-line bg-surface">
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 36 36" fill="none">
        <rect x="2" y="2" width="14" height="14" fill="var(--color-line)" />
        <rect x="5" y="5" width="8" height="8" fill="var(--color-surface)" />
        <rect x="6" y="6" width="6" height="6" fill="var(--color-muted)" />
        <rect x="20" y="2" width="14" height="14" fill="var(--color-line)" />
        <rect x="23" y="5" width="8" height="8" fill="var(--color-surface)" />
        <rect x="24" y="6" width="6" height="6" fill="var(--color-muted)" />
        <rect x="2" y="20" width="14" height="14" fill="var(--color-line)" />
        <rect x="5" y="23" width="8" height="8" fill="var(--color-surface)" />
        <rect x="6" y="24" width="6" height="6" fill="var(--color-muted)" />
        <rect x="20" y="20" width="4" height="4" fill="var(--color-muted)" />
        <rect x="26" y="20" width="4" height="4" fill="var(--color-muted)" />
        <rect x="20" y="26" width="4" height="4" fill="var(--color-muted)" />
        <rect x="26" y="26" width="4" height="4" fill="var(--color-muted)" />
        <rect x="24" y="24" width="4" height="4" fill="var(--color-line)" />
      </svg>
      <span className="font-mono text-[8px] text-muted">QR</span>
    </div>
  )
}
