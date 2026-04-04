import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronDown, AlertCircle, CheckCircle } from 'lucide-react'
import { assess } from '../lib/api'
import PageTransition from '../components/PageTransition'

const STATES = [
  'Perlis','Kedah','Penang','Perak','Selangor','Kuala Lumpur',
  'Negeri Sembilan','Melaka','Johor','Pahang','Terengganu',
  'Kelantan','Sabah','Sarawak','Labuan','Putrajaya',
]
const ORIENTATIONS = ['South', 'North', 'East', 'West']

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" style={{ color: '#16213E' }}>
        {label}
        {hint && <span className="ml-1.5 text-xs text-gray-400 font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = `w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
  bg-white outline-none transition-all
  focus:border-teal-500 focus:ring-2 focus:ring-teal-100
  placeholder:text-gray-300`

export default function Assess() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const scanState = location.state ?? {}
  const fromScan  = !!scanState.fromScan

  const [form, setForm] = useState({
    state:                   '',
    monthly_consumption_kwh: scanState.consumption ?? '',
    roof_area_sqm:           '',
    roof_orientation:        '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    setError(null)
  }

  function validate() {
    if (!form.state)                                return 'Please select your state.'
    if (!form.monthly_consumption_kwh || +form.monthly_consumption_kwh <= 0)
                                                    return 'Enter a valid monthly consumption (kWh).'
    if (!form.roof_area_sqm || +form.roof_area_sqm <= 0)
                                                    return 'Enter a valid roof area (m²).'
    if (!form.roof_orientation)                     return 'Please select a roof orientation.'
    return null
  }

  async function submit(e) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    setError(null)
    try {
      const result = await assess({
        state:                   form.state,
        monthly_consumption_kwh: +form.monthly_consumption_kwh,
        roof_area_sqm:           +form.roof_area_sqm,
        roof_orientation:        form.roof_orientation,
      })
      navigate('/result', { state: { result, inputs: form } })
    } catch (e) {
      setError(e?.response?.data?.detail ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageTransition>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#16213E' }}>Solar Assessment</h1>
          <p className="mt-1 text-gray-500">
            Fill in your details and we'll calculate the optimal system for your home.
          </p>
          {fromScan && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
              style={{ background: '#E0F7F7', color: '#0D7377' }}
            >
              <CheckCircle size={15} />
              Consumption pre-filled from your scanned bill — just add the roof details below.
            </motion.div>
          )}
        </div>

        <form onSubmit={submit} noValidate className="space-y-5">
          {/* State */}
          <Field label="State" hint="(where your home is located)">
            <div className="relative">
              <select
                value={form.state}
                onChange={e => set('state', e.target.value)}
                className={`${inputCls} appearance-none pr-10 cursor-pointer`}
              >
                <option value="" disabled>Select a state…</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </Field>

          {/* Consumption */}
          <Field label="Monthly Electricity Consumption" hint="(from your TNB bill)">
            <div className="relative">
              <input
                type="number"
                min="1"
                placeholder="e.g. 350"
                value={form.monthly_consumption_kwh}
                onChange={e => set('monthly_consumption_kwh', e.target.value)}
                className={`${inputCls} pr-14`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">kWh</span>
            </div>
            {fromScan && scanState.consumption && (
              <p className="text-xs" style={{ color: '#0D7377' }}>
                ✓ Pre-filled from your scanned bill
              </p>
            )}
          </Field>

          {/* Roof area */}
          <Field label="Available Roof Area" hint="(total usable area, not just south-facing)">
            <div className="relative">
              <input
                type="number"
                min="1"
                placeholder="e.g. 40"
                value={form.roof_area_sqm}
                onChange={e => set('roof_area_sqm', e.target.value)}
                className={`${inputCls} pr-12`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">m²</span>
            </div>
          </Field>

          {/* Orientation */}
          <Field label="Primary Roof Orientation" hint="(direction the panels will face)">
            <div className="grid grid-cols-4 gap-2">
              {ORIENTATIONS.map(o => (
                <button
                  key={o}
                  type="button"
                  onClick={() => set('roof_orientation', o)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    form.roof_orientation === o
                      ? 'text-white border-transparent'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800'
                  }`}
                  style={form.roof_orientation === o ? { background: '#0D7377', borderColor: '#0D7377' } : {}}
                >
                  {o}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              South-facing panels receive the most sunlight in Malaysia.
            </p>
          </Field>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600"
            >
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ background: '#0D7377' }}
          >
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Calculating…
                </span>
              : 'Calculate My Solar Potential'
            }
          </button>
        </form>
      </div>
    </PageTransition>
  )
}
