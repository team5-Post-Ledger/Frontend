export function AuthSuccessPanel({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-10 text-center">
      <div className="mx-auto mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-full border-2 border-success">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-success"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <div className="text-xl font-bold text-ink">{title}</div>
      <p className="mt-2.5 text-sm leading-relaxed text-muted">{message}</p>
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted">
        <span className="h-3.5 w-3.5 rounded-full border-2 border-line border-t-muted motion-safe:animate-spin" />
        이동 중...
      </div>
    </div>
  )
}
