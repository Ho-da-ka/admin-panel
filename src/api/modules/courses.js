import http from '../http'

function unwrap(response) {
  const body = response.data
  if (!body?.success) {
    throw new Error(body?.message || '请求失败')
  }
  return body.data
}

export async function listCourses(params) {
  return unwrap(await http.get('/courses', { params }))
}

export async function getCourse(id) {
  return unwrap(await http.get(`/courses/${id}`))
}

export async function getCourseStudents(id) {
  return unwrap(await http.get(`/courses/${id}/students`))
}

export async function getCourseAttendanceStats(id) {
  return unwrap(await http.get(`/courses/${id}/attendance-stats`))
}

export async function createCourse(payload, options = {}) {
  return unwrap(await http.post('/courses', payload, {
    params: { ignoreConflict: !!options.ignoreConflict }
  }))
}

export async function updateCourse(id, payload, options = {}) {
  return unwrap(await http.put(`/courses/${id}`, payload, {
    params: { ignoreConflict: !!options.ignoreConflict }
  }))
}

export async function deleteCourse(id, force = false) {
  return unwrap(await http.delete(`/courses/${id}`, { params: { force } }))
}

