import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export async function assess(payload) {
  const { data } = await api.post('/assess', payload)
  return data
}

export async function scanBill(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/scan-bill', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export function reportUrl() {
  return '/api/report'
}

export default api
