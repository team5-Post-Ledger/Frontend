import type { AccountStatus } from '../features/platform/api'

const STATUS_BADGES: Record<AccountStatus, { label: string; className: string }> = {
  INVITED: { label: '초대됨 · 수락 대기', className: 'bg-warning/10 text-warning' },
  ACTIVE: { label: '활성', className: 'bg-success/10 text-success' },
  INACTIVE: { label: '비활성', className: 'bg-muted/10 text-muted' },
}

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const badge = STATUS_BADGES[status]
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${badge.className}`}>
      {badge.label}
    </span>
  )
}
