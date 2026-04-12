import http from '../http'

function unwrap(response) {
  const body = response.data
  if (!body?.success) {
    throw new Error(body?.message || '请求失败')
  }
  return body.data
}

export async function listStageEvaluations(params) {
  return unwrap(await http.get('/stage-evaluations', { params }))
}

export async function createStageEvaluation(payload) {
  return unwrap(await http.post('/stage-evaluations', payload))
}

export async function updateStageEvaluation(id, payload) {
  return unwrap(await http.put(`/stage-evaluations/${id}`, payload))
}
