import http from '../http'

function unwrap(response) {
  const body = response.data
  if (!body?.success) {
    throw new Error(body?.message || 'AI请求失败')
  }
  return body.data
}

export async function generateTrainingSummary(payload) {
  return unwrap(await http.post('/ai/generate-training-summary', payload))
}

export async function getStudentInsights(studentId) {
  return unwrap(await http.get(`/ai/student-insights/${studentId}`))
}
