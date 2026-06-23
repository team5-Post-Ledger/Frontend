const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function formatSlotRange(startAt: string, endAt: string): string {
  const start = new Date(startAt)
  const end = new Date(endAt)
  const pad = (value: number) => String(value).padStart(2, '0')
  const datePart = `${start.getMonth() + 1}.${pad(start.getDate())}(${WEEKDAYS[start.getDay()]})`
  const timePart = `${pad(start.getHours())}:${pad(start.getMinutes())}–${pad(end.getHours())}:${pad(end.getMinutes())}`
  return `${datePart} ${timePart}`
}
