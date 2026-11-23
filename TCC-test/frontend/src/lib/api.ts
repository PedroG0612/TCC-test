import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('appliety_token')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  if (config.data instanceof FormData && config.headers) {
    if (typeof (config.headers as any).delete === 'function') {
      ;(config.headers as any).delete('Content-Type')
    } else {
      delete config.headers['Content-Type']
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('appliety_token')) {
      // Only force logout on endpoints that require auth — the caller decides.
      localStorage.removeItem('appliety_token')
    }
    return Promise.reject(error)
  },
)

export default api
