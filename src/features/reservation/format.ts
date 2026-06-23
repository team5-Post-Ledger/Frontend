export function getReservationCode(id: number): string {
  return `RSV-${String(id).padStart(6, '0')}`
}
