interface ConsoleUserMenuProps {
  name?: string
  role?: string
  onLogout: () => void
}

// 관리자 계열 콘솔(admin·accountant·platform) 상단바 우측에 공통으로 쓰는
// 아바타 + 이름/역할 + 로그아웃 블록. '메인 사이트' 링크는 ConsoleTopBar가 따로 둔다.
export function ConsoleUserMenu({ name, role, onLogout }: ConsoleUserMenuProps) {
  return (
    <div className="flex items-center gap-2.5 border-l border-line pl-3">
      <span className="flex h-8 w-8 items-center justify-center bg-primary text-xs font-bold text-white">
        {name?.slice(0, 1) ?? '?'}
      </span>

      <div className="hidden leading-tight sm:block">
        <div className="text-sm font-semibold text-ink">{name ?? '-'}</div>
        <div className="text-xs text-muted">{role}</div>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="ml-1 px-2 py-1 text-sm font-semibold text-muted transition-colors hover:bg-surface hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        로그아웃
      </button>
    </div>
  )
}
