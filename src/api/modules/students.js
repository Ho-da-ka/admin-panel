import http from '../http'

function unwrap(response) {
  const body = response.data
  if (!body?.success) {
    throw new Error(body?.message || '请求失败')
  }
  return body.data
}

export async function listStudents(params) {
  return unwrap(await http.get('/students', { params }))
}

export async function getStudent(id) {
  return unwrap(await http.get(`/students/${id}`))
}

export async function createStudent(payload) {
  return unwrap(await http.post('/students', payload))
}

export async function updateStudent(id, payload) {
  return unwrap(await http.put(`/students/${id}`, payload))
}

export async function deleteStudent(id) {
  return unwrap(await http.delete(`/students/${id}`))
}

export async function importStudents(file) {
  const formData = new FormData()
  formData.append('file', file)
  return unwrap(await http.post('/students/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }))
}

export async function downloadStudentImportTemplate() {
  const response = await http.get('/students/import-template', { responseType: 'blob' })
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'student-import-template.xlsx'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export async function getStudentProfile(id) {
  return unwrap(await http.get(`/students/${id}/profile`))
}

export async function getStudentAttendanceStats(id) {
  return unwrap(await http.get(`/students/${id}/attendance-stats`))
}

export async function getStudentFitnessTrends(id) {
  return unwrap(await http.get(`/students/${id}/fitness-trends`))
}

export async function listCareAlerts(params) {
  return unwrap(await http.get('/care-alerts', { params }))
}

export async function getStudentCareAlerts(id) {
  return listCareAlerts({ studentId: id })
}

