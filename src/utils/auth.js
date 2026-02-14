const AUTH_KEY = 'zf_admin_auth'

export function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null')
  } catch {
    return null
  }
}

export function setAuth(payload) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(payload))
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY)
}

export function isLoggedIn() {
  const auth = getAuth()
  return Boolean(auth?.token)
}

export function getBasicToken() {
  return getAuth()?.token || ''
}

export function getRole() {
  return getAuth()?.role || ''
}

export function getDisplayName() {
  return getAuth()?.username || ''
}
