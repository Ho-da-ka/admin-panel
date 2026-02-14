const PREFIX = 'zf_admin_draft:'

export function loadDraft(key, fallbackValue) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return fallbackValue
    return JSON.parse(raw)
  } catch {
    return fallbackValue
  }
}

export function saveDraft(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

export function clearDraft(key) {
  localStorage.removeItem(PREFIX + key)
}