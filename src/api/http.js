import axios from 'axios'
import { ElMessage } from 'element-plus'
import { clearAuth, getBasicToken } from '../utils/auth'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api/v1',
  timeout: 12000
})

http.interceptors.request.use((config) => {
  const token = getBasicToken()
  if (token) {
    config.headers.Authorization = `Basic ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      clearAuth()
      ElMessage.error('登录已失效，请重新登录')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default http
