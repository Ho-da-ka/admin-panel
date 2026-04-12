import http from '../http'

function unwrap(response) {
  const body = response.data
  if (!body?.success) {
    throw new Error(body?.message || '请求失败')
  }
  return body.data
}

export async function listFitnessTests(params) {
  return unwrap(await http.get('/fitness-tests', { params }))
}

export async function createFitnessTest(payload) {
  return unwrap(await http.post('/fitness-tests', payload))
}

export async function updateFitnessTest(id, payload) {
  return unwrap(await http.put(`/fitness-tests/${id}`, payload))
}

export async function deleteFitnessTest(id) {
  return unwrap(await http.delete(`/fitness-tests/${id}`))
}

