import http from './http'

function unwrap(response) {
  const body = response.data
  if (!body?.success) {
    throw new Error(body?.message || '请求失败')
  }
  return body.data
}

export async function pingHealth() {
  return unwrap(await http.get('/public/ping'))
}

export async function login(payload) {
  return unwrap(await http.post('/auth/login', payload, { skipAuth: true }))
}

export async function logout(payload) {
  return unwrap(await http.post('/auth/logout', payload || {}, { skipAuth: true }))
}

export async function changeOwnPassword(payload) {
  return unwrap(await http.post('/auth/change-password', payload))
}

export async function adminSetPassword(payload) {
  return unwrap(await http.put('/user-accounts/password', payload))
}

export async function adminResetPassword(payload) {
  return unwrap(await http.post('/user-accounts/reset-password', payload))
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

export async function listCourses(params) {
  return unwrap(await http.get('/courses', { params }))
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

export async function getCourse(id) {
  return unwrap(await http.get(`/courses/${id}`))
}

export async function createCourse(payload) {
  return unwrap(await http.post('/courses', payload))
}

export async function updateCourse(id, payload) {
  return unwrap(await http.put(`/courses/${id}`, payload))
}

export async function searchAttendances(params) {
  return unwrap(await http.get('/attendances', { params }))
}

export async function updateAttendance(id, payload) {
  return unwrap(await http.put(`/attendances/${id}`, payload))
}

export async function createAttendance(payload) {
  return unwrap(await http.post('/attendances', payload))
}

export async function deleteAttendance(id) {
  return unwrap(await http.delete(`/attendances/${id}`))
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

export async function deleteCourse(id, force = false) {
  return unwrap(await http.delete(`/courses/${id}`, { params: { force } }))
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
