import http from '../http'

function unwrap(response) {
  const body = response.data
  if (!body?.success) {
    throw new Error(body?.message || '请求失败')
  }
  return body.data
}

export async function pingHealth() {
  return unwrap(await http.get('/public/ping'))
}

export async function login(payload) {
  return unwrap(await http.post('/auth/login', payload, { skipAuth: true }))
}

export async function logout(payload) {
  return unwrap(await http.post('/auth/logout', payload || {}, { skipAuth: true }))
}

export async function changeOwnPassword(payload) {
  return unwrap(await http.post('/auth/change-password', payload))
}

export async function adminSetPassword(payload) {
  return unwrap(await http.put('/user-accounts/password', payload))
}

export async function adminResetPassword(payload) {
  return unwrap(await http.post('/user-accounts/reset-password', payload))
}

