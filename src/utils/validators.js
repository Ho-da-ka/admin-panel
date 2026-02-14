export const GUARDIAN_PHONE_REGEX = /^$|^[0-9+\-]{6,20}$/

export function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : value
}

export function isFutureDate(dateText) {
  if (!dateText) return false
  const selected = new Date(`${dateText}T00:00:00`)
  if (Number.isNaN(selected.getTime())) return false
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)
  return selected > todayEnd
}
