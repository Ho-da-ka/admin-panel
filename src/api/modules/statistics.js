import http from '../http'

function unwrap(response) {
  const body = response.data
  if (!body?.success) {
    throw new Error(body?.message || '请求失败')
  }
  return body.data
}

export async function getDashboardStats() {
  return unwrap(await http.get('/statistics/dashboard'))
}

export async function getCoachWorkload() {
  return unwrap(await http.get('/statistics/coach-workload'))
}

