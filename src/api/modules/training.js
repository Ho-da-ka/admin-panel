import http from '../http'

function unwrap(response) {
  const body = response.data
  if (!body?.success) {
    throw new Error(body?.message || '请求失败')
  }
  return body.data
}

export async function listTrainingRecords(params) {
  return unwrap(await http.get('/training-records', { params }))
}

export async function deleteTrainingRecord(id) {
  return unwrap(await http.delete(`/training-records/${id}`))
}

export async function getTrainingRecord(id) {
  return unwrap(await http.get(`/training-records/${id}`))
}

export async function createTrainingRecord(payload) {
  return unwrap(await http.post('/training-records', payload))
}

export async function updateTrainingRecord(id, payload) {
  return unwrap(await http.put(`/training-records/${id}`, payload))
}

