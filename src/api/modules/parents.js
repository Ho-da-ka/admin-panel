import http from '../http'

function unwrap(response) {
  const body = response.data
  if (!body?.success) {
    throw new Error(body?.message || '请求失败')
  }
  return body.data
}

export async function listParents(params) {
  return unwrap(await http.get('/parents', { params }))
}

export async function getParent(id) {
  return unwrap(await http.get(`/parents/${id}`))
}

export async function createManualParentBinding(payload) {
  return unwrap(await http.post('/parents/manual-bindings', payload))
}

export async function removeManualParentBinding(parentId, studentId) {
  return unwrap(await http.delete(`/parents/${parentId}/students/${studentId}/manual-binding`))
}
