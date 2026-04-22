import http from '../http'

function unwrap(response) {
  const body = response.data
  if (!body?.success) {
    throw new Error(body?.message || '请求失败')
  }
  return body.data
}

export async function listCoaches(params) {
  return unwrap(await http.get('/coaches', { params }))
}

export async function listCoachOptions() {
  return unwrap(await http.get('/coaches/options'))
}

export async function getCoach(id) {
  return unwrap(await http.get(`/coaches/${id}`))
}

export async function createCoach(payload) {
  return unwrap(await http.post('/coaches', payload))
}

export async function updateCoach(id, payload) {
  return unwrap(await http.put(`/coaches/${id}`, payload))
}

export async function deleteCoach(id) {
  return unwrap(await http.delete(`/coaches/${id}`))
}
