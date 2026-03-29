import axios from 'axios'
import { ElMessage } from 'element-plus'
import { clearAuth, getAccessToken, getAuth, getRefreshToken, setAuth } from '../utils/auth'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api/v1',
  timeout: 12000
})

let refreshingPromise = null

function redirectToLogin() {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error('refresh token missing')
  }

  const response = await http.post(
    '/auth/refresh',
    { refreshToken },
    { skipAuth: true, _isRefreshCall: true }
  )
  const body = response.data
  if (!body?.success || !body?.data) {
    throw new Error(body?.message || '刷新令牌失败')
  }

  const current = getAuth()
  setAuth({
    ...current,
    accessToken: body.data.accessToken,
    refreshToken: body.data.refreshToken,
    role: body.data.role,
    username: body.data.username
  })
}

http.interceptors.request.use((config) => {
  if (!config.skipAuth) {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status
    const originalRequest = error?.config

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest._isRefreshCall &&
      !originalRequest.skipAuth
    ) {
      try {
        if (!refreshingPromise) {
          refreshingPromise = refreshAccessToken().finally(() => {
            refreshingPromise = null
          })
        }
        await refreshingPromise
        originalRequest._retry = true
        const token = getAccessToken()
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`
        }
        return http(originalRequest)
      } catch {
        clearAuth()
        ElMessage.error('登录状态已失效，请重新登录')
        redirectToLogin()
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default http
