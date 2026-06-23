export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatCurrency(amount: number): string {
  return `₩${amount.toLocaleString()}`
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const pad = (value: number) => String(value).padStart(2, '0')
  const startLabel = `${start.getFullYear()}.${pad(start.getMonth() + 1)}.${pad(start.getDate())}`
  const endLabel = `${pad(end.getMonth() + 1)}.${pad(end.getDate())}`
  return `${startLabel} – ${endLabel}`
}
