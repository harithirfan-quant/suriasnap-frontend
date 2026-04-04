import axios from 'axios'

// ─── loading state ────────────────────────────────────────────────────────────
// A simple pub/sub so any component can react to global loading without Redux.
const loadingListeners = new Set()
let   activeRequests   = 0

function setLoading(loading) {
  loadingListeners.forEach(fn => fn(loading))
}

export function onLoadingChange(fn) {
  loadingListeners.add(fn)
  return () => loadingListeners.delete(fn)   // returns unsubscribe
}

// ─── axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  timeout: 30_000,
})

// ─── request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(config => {
  activeRequests++
  if (activeRequests === 1) setLoading(true)
  return config
})

// ─── response interceptors ────────────────────────────────────────────────────
api.interceptors.response.use(
  response => {
    activeRequests = Math.max(0, activeRequests - 1)
    if (activeRequests === 0) setLoading(false)
    return response
  },
  error => {
    activeRequests = Math.max(0, activeRequests - 1)
    if (activeRequests === 0) setLoading(false)

    // Normalise errors into a consistent shape
    const status  = error.response?.status
    const detail  = error.response?.data?.detail

    let message
    if (!error.response) {
      message = 'Cannot reach the server. Make sure the backend is running.'
    } else if (status === 422) {
      // FastAPI validation errors can be a list
      message = Array.isArray(detail)
        ? detail.map(e => e.msg).join(', ')
        : (detail ?? 'Invalid input. Please check your values.')
    } else if (status === 413) {
      message = 'File too large. Please upload an image under 10 MB.'
    } else if (status === 415) {
      message = 'Unsupported file type. Please upload a JPEG or PNG.'
    } else if (status >= 500) {
      message = 'Server error. Please try again in a moment.'
    } else {
      message = detail ?? error.message ?? 'Something went wrong.'
    }

    // Attach normalised message so callers don't need to dig into error.response
    error.userMessage = message
    return Promise.reject(error)
  },
)

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * POST /api/scan-bill
 * Uploads an image file and returns extracted bill data.
 * @param {File} imageFile
 */
export async function scanBill(imageFile) {
  const form = new FormData()
  form.append('file', imageFile)
  const { data } = await api.post('/api/scan-bill', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/**
 * POST /api/assess
 * Runs the solar calculation engine and returns assessment results.
 * @param {{ state: string, monthly_consumption_kwh: number, roof_area_sqm: number, roof_orientation: string }} payload
 */
export async function assessSolar(payload) {
  const { data } = await api.post('/api/assess', payload)
  return data
}

/**
 * POST /api/report
 * Generates a PDF report and returns it as a Blob ready for download.
 * @param {{ state: string, monthly_consumption_kwh: number, roof_area_sqm: number, roof_orientation: string }} payload
 * @returns {Blob}
 */
export async function downloadReport(payload) {
  const { data } = await api.post('/api/report', payload, {
    responseType: 'blob',
  })
  return data
}

export default api
