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
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // ignore draft write errors (quota / serialization), must not block UI interaction
  }
}

export function clearDraft(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // ignore
  }
}
