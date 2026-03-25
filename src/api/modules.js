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

export async function createAttendance(payload) {
  return unwrap(await http.post('/attendances', payload))
}

export async function listFitnessTests(params) {
  return unwrap(await http.get('/fitness-tests', { params }))
}

export async function createFitnessTest(payload) {
  return unwrap(await http.post('/fitness-tests', payload))
}

export async function listTrainingRecords(params) {
  return unwrap(await http.get('/training-records', { params }))
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
