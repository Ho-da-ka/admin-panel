import http from '../http'

function unwrap(response) {
  const body = response.data
  if (!body?.success) {
    throw new Error(body?.message || '请求失败')
  }
  return body.data
}

export async function searchAttendances(params) {
  return unwrap(await http.get('/attendances', { params }))
}

export const listAttendances = searchAttendances

export async function updateAttendance(id, payload) {
  return unwrap(await http.put(`/attendances/${id}`, payload))
}

export async function createAttendance(payload) {
  return unwrap(await http.post('/attendances', payload))
}

export async function batchCreateAttendance(payload) {
  return unwrap(await http.post('/attendances/batch', payload))
}

export async function deleteAttendance(id) {
  return unwrap(await http.delete(`/attendances/${id}`))
}

