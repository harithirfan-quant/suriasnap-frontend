import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronLeft, AlertCircle, Home, Zap, Sunset } from 'lucide-react'
import { assessSolar } from '../services/api'
import PageTransition from '../components/PageTransition'

// ─── constants ────────────────────────────────────────────────────────────────

const TEAL = '#0D7377'
const DARK = '#16213E'

const STATES = [
  'Perlis', 'Kedah', 'Penang', 'Perak', 'Selangor', 'Kuala Lumpur',
  'Negeri Sembilan', 'Melaka', 'Johor', 'Pahang', 'Terengganu',
  'Kelantan', 'Sabah', 'Sarawak', 'Labuan', 'Putrajaya',
]

const ROOF_SIZES = [
  {
    id: 'small',
    label: 'Small',
    range: '< 50 m²',
    value: 35,
    desc: 'Terrace / apartment rooftop',
    icon: '🏠',
  },
  {
    id: 'medium',
    label: 'Medium',
    range: '50 – 100 m²',
    value: 75,
    desc: 'Semi-detached / corner lot',
    icon: '🏡',
  },
  {
    id: 'large',
    label: 'Large',
    range: '> 100 m²',
    value: 130,
    desc: 'Bungalow / detached home',
    icon: '🏘️',
  },
]

const ORIENTATIONS = [
  { label: 'N', full: 'North',  factor: '95%' },
  { label: 'S', full: 'South',  factor: '100%', recommended: true },
  { label: 'E', full: 'East',   factor: '90%' },
  { label: 'W', full: 'West',   factor: '90%' },
]

// kWh slider markers
const MARKERS = [
  { pct: 0,    label: 'Low',     kwh: 100 },
  { pct: 38,   label: 'Average', kwh: 400 },
  { pct: 100,  label: 'High',    kwh: 2000 },
]

const MIN_KWH = 100
const MAX_KWH = 2000

// ─── sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step, total }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Step {step} of {total}
        </span>
        <span className="text-xs text-gray-400">{Math.round((step / total) * 100)}% complete</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: TEAL }}
          initial={false}
          animate={{ width: `${(step / total) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
      </div>
      <div className="flex justify-between mt-2">
        {['Location', 'Electricity', 'Roof'].map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
              style={{
                background: i + 1 <= step ? TEAL : '#E5E7EB',
                color:      i + 1 <= step ? '#fff' : '#9CA3AF',
              }}
            >
              {i + 1 <= step ? '✓' : i + 1}
            </div>
            <span className="text-xs hidden sm:block"
                  style={{ color: i + 1 <= step ? TEAL : '#9CA3AF' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StepHeading({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
           style={{ background: '#E0F7F7' }}>
        <Icon size={20} style={{ color: TEAL }} />
      </div>
      <div>
        <h2 className="text-xl font-bold" style={{ color: DARK }}>{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}

// ─── step 1: state ────────────────────────────────────────────────────────────

function Step1({ value, onChange }) {
  return (
    <>
      <StepHeading
        icon={Home}
        title="Where is your home?"
        subtitle="Solar irradiance varies across Malaysia — we use your state's GHI data."
      />
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-3.5 pr-10 rounded-xl border text-sm bg-white outline-none appearance-none cursor-pointer transition-all"
          style={{
            borderColor: value ? TEAL : '#E5E7EB',
            boxShadow:   value ? `0 0 0 3px ${TEAL}18` : 'none',
          }}
        >
          <option value="" disabled>Select your state…</option>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {value && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="mt-3 px-4 py-3 rounded-xl text-sm"
          style={{ background: '#E0F7F7', color: TEAL }}
        >
          📍 Using solar irradiance (GHI) data for <strong>{value}</strong>
        </motion.div>
      )}
    </>
  )
}

// ─── step 2: consumption ──────────────────────────────────────────────────────

function kwhToSlider(kwh) {
  // map 100–2000 → 0–100 linearly
  return Math.round(((kwh - MIN_KWH) / (MAX_KWH - MIN_KWH)) * 100)
}
function sliderToKwh(pct) {
  return Math.round(MIN_KWH + (pct / 100) * (MAX_KWH - MIN_KWH))
}

function getBillEstimate(kwh) {
  // rough TNB bill estimate
  if (kwh <= 300)  return 'Approx. RM 60 – 90 / month'
  if (kwh <= 600)  return 'Approx. RM 90 – 180 / month'
  if (kwh <= 1000) return 'Approx. RM 180 – 320 / month'
  if (kwh <= 1500) return 'Approx. RM 320 – 520 / month'
  return 'Approx. RM 520+ / month'
}

function Step2({ value, onChange }) {
  const sliderPct = kwhToSlider(value)
  const inputRef  = useRef()

  function handleSlider(e) {
    onChange(sliderToKwh(+e.target.value))
  }
  function handleInput(e) {
    const n = parseInt(e.target.value, 10)
    if (!isNaN(n)) onChange(Math.max(MIN_KWH, Math.min(MAX_KWH, n)))
  }

  return (
    <>
      <StepHeading
        icon={Zap}
        title="How much electricity do you use?"
        subtitle="Find this on your TNB bill — usually labelled 'kWh' or 'Unit Guna'."
      />

      {/* big kWh display */}
      <div className="flex items-baseline justify-center gap-2 mb-6">
        <input
          ref={inputRef}
          type="number"
          min={MIN_KWH}
          max={MAX_KWH}
          value={value}
          onChange={handleInput}
          className="w-28 text-4xl font-bold text-center bg-transparent outline-none border-b-2 pb-1 transition-colors"
          style={{ color: TEAL, borderColor: TEAL }}
        />
        <span className="text-lg text-gray-400 font-medium">kWh / month</span>
      </div>

      {/* slider */}
      <div className="relative px-1 mb-2">
        <input
          type="range"
          min={0}
          max={100}
          value={sliderPct}
          onChange={handleSlider}
          className="w-full h-2 rounded-full outline-none cursor-pointer appearance-none"
          style={{
            background: `linear-gradient(to right, ${TEAL} 0%, ${TEAL} ${sliderPct}%, #E5E7EB ${sliderPct}%, #E5E7EB 100%)`,
          }}
        />
      </div>

      {/* markers */}
      <div className="flex justify-between text-xs text-gray-400 px-1 mb-5">
        <span>100 kWh<br /><span className="text-gray-300">Low</span></span>
        <span className="text-center">400–600 kWh<br /><span style={{ color: TEAL }}>Average home</span></span>
        <span className="text-right">2,000 kWh<br /><span className="text-gray-300">High</span></span>
      </div>

      {/* usage band */}
      <div className="rounded-xl border p-4 flex items-center justify-between"
           style={{ borderColor: `${TEAL}22`, background: '#E0F7F7' }}>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Estimated TNB bill</p>
          <p className="font-semibold text-sm" style={{ color: DARK }}>{getBillEstimate(value)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-0.5">Usage category</p>
          <p className="font-semibold text-sm" style={{ color: TEAL }}>
            {value < 300 ? 'Low' : value < 700 ? 'Average' : value < 1300 ? 'Above average' : 'High'}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-center text-gray-400">
        Average Malaysian household uses 400 – 600 kWh per month
      </p>
    </>
  )
}

// ─── step 3: roof ─────────────────────────────────────────────────────────────

function Step3({ roofArea, onArea, orientation, onOrientation }) {
  const [selectedSize, setSelectedSize]   = useState(null)
  const [customArea,   setCustomArea]     = useState(roofArea || '')

  function pickSize(size) {
    setSelectedSize(size.id)
    setCustomArea(size.value)
    onArea(size.value)
  }

  function handleCustom(e) {
    setSelectedSize(null)
    const v = e.target.value
    setCustomArea(v)
    const n = parseFloat(v)
    if (!isNaN(n) && n > 0) onArea(n)
  }

  return (
    <>
      <StepHeading
        icon={Sunset}
        title="Tell us about your roof"
        subtitle="We'll calculate how many panels fit and the best configuration."
      />

      {/* size cards */}
      <div className="mb-5">
        <p className="text-sm font-medium mb-2.5" style={{ color: DARK }}>Available roof area</p>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {ROOF_SIZES.map(size => (
            <button
              key={size.id}
              type="button"
              onClick={() => pickSize(size)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all active:scale-95"
              style={{
                borderColor: selectedSize === size.id ? TEAL : '#E5E7EB',
                background:  selectedSize === size.id ? '#E0F7F7' : '#fff',
                boxShadow:   selectedSize === size.id ? `0 0 0 3px ${TEAL}18` : 'none',
              }}
            >
              <span className="text-2xl">{size.icon}</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: DARK }}>{size.label}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: selectedSize === size.id ? TEAL : '#9CA3AF' }}>
                  {size.range}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* show desc of selected size */}
        <AnimatePresence>
          {selectedSize && (
            <motion.p
              key={selectedSize}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-xs text-center mb-3"
              style={{ color: TEAL }}
            >
              {ROOF_SIZES.find(s => s.id === selectedSize)?.desc}
              {' — '}using {ROOF_SIZES.find(s => s.id === selectedSize)?.value} m²
            </motion.p>
          )}
        </AnimatePresence>

        {/* exact input */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400 shrink-0">or enter exact area</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        <div className="relative mt-3">
          <input
            type="number"
            min="1"
            placeholder="e.g. 60"
            value={customArea}
            onChange={handleCustom}
            className="w-full px-4 py-3 pr-12 rounded-xl border text-sm bg-white outline-none transition-all"
            style={{
              borderColor: !selectedSize && customArea ? TEAL : '#E5E7EB',
              boxShadow:   !selectedSize && customArea ? `0 0 0 3px ${TEAL}18` : 'none',
            }}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">m²</span>
        </div>
      </div>

      {/* orientation */}
      <div>
        <p className="text-sm font-medium mb-2.5" style={{ color: DARK }}>Primary roof orientation</p>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {ORIENTATIONS.map(o => (
            <button
              key={o.full}
              type="button"
              onClick={() => onOrientation(o.full)}
              className="relative flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all active:scale-95"
              style={{
                borderColor: orientation === o.full ? TEAL : '#E5E7EB',
                background:  orientation === o.full ? '#E0F7F7' : '#fff',
                boxShadow:   orientation === o.full ? `0 0 0 3px ${TEAL}18` : 'none',
              }}
            >
              {o.recommended && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs px-1.5 py-0.5 rounded-full text-white font-medium"
                      style={{ background: TEAL, fontSize: '9px' }}>
                  BEST
                </span>
              )}
              <span className="text-base font-bold" style={{ color: orientation === o.full ? TEAL : DARK }}>
                {o.label}
              </span>
              <span className="text-xs" style={{ color: orientation === o.full ? TEAL : '#9CA3AF' }}>
                {o.factor}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center">
          South-facing panels receive the most sunlight in Malaysia (100% efficiency factor).
        </p>
      </div>
    </>
  )
}

// ─── slide variants ───────────────────────────────────────────────────────────

function slideVariants(dir) {
  return {
    initial: { opacity: 0, x: dir * 40 },
    animate: { opacity: 1, x: 0,        transition: { duration: 0.28, ease: 'easeOut' } },
    exit:    { opacity: 0, x: dir * -30, transition: { duration: 0.18, ease: 'easeIn'  } },
  }
}

// ─── main component ───────────────────────────────────────────────────────────

export default function AssessPage() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const scanState  = location.state ?? {}

  const detectedState = scanState.detectedState ?? null

  const [step,        setStep]        = useState(detectedState ? 2 : 1)
  const [dir,         setDir]         = useState(1)   // 1 = forward, -1 = backward
  const [loading,     setLoading]     = useState(false)
  const [apiError,    setApiError]    = useState(null)

  const [state,       setState]       = useState(detectedState ?? '')
  const [consumption, setConsumption] = useState(scanState.consumption ?? 400)
  const [roofArea,    setRoofArea]    = useState(null)
  const [orientation, setOrientation] = useState('South')

  // ── validation per step ────────────────────────────────────────────────────

  function canAdvance() {
    if (step === 1) return !!state
    if (step === 2) return consumption >= MIN_KWH
    if (step === 3) return !!roofArea && !!orientation
    return false
  }

  // ── navigation ─────────────────────────────────────────────────────────────

  function next() {
    if (!canAdvance()) return
    setDir(1)
    setApiError(null)
    if (step < 3) { setStep(s => s + 1); return }
    submit()
  }

  function back() {
    if (step === 1) { navigate(-1); return }
    // If state was auto-detected and we're on step 2, go back to scan page
    if (step === 2 && detectedState) { navigate(-1); return }
    setDir(-1)
    setStep(s => s - 1)
  }

  async function submit() {
    setLoading(true)
    setApiError(null)
    try {
      const result = await assessSolar({
        state,
        monthly_consumption_kwh: consumption,
        roof_area_sqm:           roofArea,
        roof_orientation:        orientation,
      })
      navigate('/result', {
        state: {
          result,
          inputs: { state, monthly_consumption_kwh: consumption, roof_area_sqm: roofArea, roof_orientation: orientation },
        },
      })
    } catch (e) {
      setApiError(e?.userMessage ?? 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  // ── render ─────────────────────────────────────────────────────────────────

  const buttonLabel = step < 3 ? 'Continue' : loading ? 'Calculating…' : 'Calculate Solar Potential'

  return (
    <PageTransition>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">

        {/* from-scan notices */}
        {scanState.fromScan && step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="mb-3 space-y-2"
          >
            {detectedState && (
              <div className="px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2"
                   style={{ background: '#D1FAE5', color: '#065F46' }}>
                📍 State auto-detected: <strong>{detectedState}</strong> — Step 1 skipped
              </div>
            )}
            <div className="px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2"
                 style={{ background: '#E0F7F7', color: TEAL }}>
              ✓ Consumption pre-filled from your scanned bill — adjust if needed.
            </div>
          </motion.div>
        )}

        <ProgressBar step={step} total={3} />

        {/* step content with slide transition */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm p-6 sm:p-8 mb-5">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={step}
              variants={slideVariants(dir)}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {step === 1 && (
                <Step1 value={state} onChange={setState} />
              )}
              {step === 2 && (
                <Step2 value={consumption} onChange={setConsumption} />
              )}
              {step === 3 && (
                <Step3
                  roofArea={roofArea}
                  onArea={setRoofArea}
                  orientation={orientation}
                  onOrientation={setOrientation}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* API error */}
        <AnimatePresence>
          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600"
            >
              <AlertCircle size={15} className="shrink-0" />
              {apiError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* nav buttons */}
        <div className="flex gap-3">
          <button
            onClick={back}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-all active:scale-95"
          >
            <ChevronLeft size={16} />
            {step === 1 ? 'Back' : 'Previous'}
          </button>

          <button
            onClick={next}
            disabled={!canAdvance() || loading}
            className="flex-1 py-3 rounded-xl font-semibold text-white text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: TEAL }}
          >
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Calculating…
                </span>
              : buttonLabel
            }
          </button>
        </div>

        {/* hint under disabled button */}
        <AnimatePresence>
          {!canAdvance() && !loading && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mt-2.5 text-xs text-center text-gray-400"
            >
              {step === 1 && 'Select your state to continue'}
              {step === 3 && !roofArea && 'Choose a roof size or enter your area to continue'}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
