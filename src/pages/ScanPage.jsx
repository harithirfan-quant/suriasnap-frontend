import { useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, Upload, CheckCircle, AlertCircle,
  X, RefreshCw, ArrowRight, ScanLine,
} from 'lucide-react'
import { scanBill } from '../services/api'
import PageTransition from '../components/PageTransition'

// ─── constants ───────────────────────────────────────────────────────────────

const ACCEPTED = ['image/jpeg', 'image/png']
const MAX_BYTES = 10 * 1024 * 1024   // 10 MB

// ─── small helpers ───────────────────────────────────────────────────────────

function validate(file) {
  if (!ACCEPTED.includes(file.type)) return 'Only JPEG and PNG images are accepted.'
  if (file.size > MAX_BYTES)         return 'Image must be under 10 MB.'
  return null
}

function EditableField({ label, value, onChange, unit, placeholder }) {
  return (
    <div className="bg-white rounded-xl p-3.5 border border-gray-100">
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <div className="flex items-center gap-1.5">
        <input
          type={unit === 'kWh' || unit === 'RM' ? 'number' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '—'}
          className="flex-1 text-sm font-semibold bg-transparent outline-none border-b border-dashed border-gray-200 focus:border-teal-400 pb-0.5 transition-colors"
          style={{ color: '#16213E' }}
        />
        {unit && <span className="text-xs text-gray-400 shrink-0">{unit}</span>}
      </div>
    </div>
  )
}

// ─── scanning overlay (shown over the preview while OCR runs) ────────────────

function ScanningOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl"
      style={{ background: 'rgba(13,115,119,0.88)', backdropFilter: 'blur(2px)' }}
    >
      {/* animated scan line */}
      <div className="relative w-40 h-40">
        <div className="absolute inset-0 rounded-xl border-2 opacity-40" style={{ borderColor: '#E0F7F7' }} />
        {/* corner brackets */}
        {[
          'top-0 left-0 border-t-2 border-l-2',
          'top-0 right-0 border-t-2 border-r-2',
          'bottom-0 left-0 border-b-2 border-l-2',
          'bottom-0 right-0 border-b-2 border-r-2',
        ].map((cls, i) => (
          <div key={i} className={`absolute w-5 h-5 rounded-sm ${cls}`}
               style={{ borderColor: '#E0F7F7' }} />
        ))}
        {/* sweeping scan line */}
        <motion.div
          className="absolute left-2 right-2 h-0.5 rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, #14BDBD, transparent)' }}
          animate={{ top: ['10%', '90%', '10%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <ScanLine size={32} color="#E0F7F7" strokeWidth={1.5} />
        </div>
      </div>
      <div className="text-center px-4">
        <p className="text-white font-semibold text-base">Scanning your TNB bill…</p>
        <p className="text-sm mt-1" style={{ color: '#14BDBD' }}>
          Reading account details &amp; usage
        </p>
        <p className="text-xs mt-2 opacity-70 text-white">
          This may take up to 30 seconds
        </p>
      </div>
    </motion.div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function ScanPage() {
  const navigate    = useNavigate()
  const dropRef     = useRef()
  const cameraRef   = useRef()
  const galleryRef  = useRef()

  // phase: 'idle' | 'scanning' | 'review' | 'error'
  const [phase,   setPhase]   = useState('idle')
  const [preview, setPreview] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [ocrError, setOcrError] = useState(null)

  // editable extracted fields
  const [fields, setFields] = useState({
    consumption_kwh:  '',
    bill_amount_rm:   '',
    account_number:   '',
    tariff_category:  '',
  })
  const [confidence, setConfidence] = useState(null)

  // ── file handling ──────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file) => {
    if (!file) return
    const err = validate(file)
    if (err) { setOcrError(err); return }

    setOcrError(null)
    setPreview(URL.createObjectURL(file))
    setPhase('scanning')

    try {
      const data = await scanBill(file)
      setFields({
        consumption_kwh: data.consumption_kwh  != null ? String(data.consumption_kwh) : '',
        bill_amount_rm:  data.bill_amount_rm   != null ? String(data.bill_amount_rm)  : '',
        account_number:  data.account_number   ?? '',
        tariff_category: data.tariff_category  ?? '',
      })
      setConfidence(data.confidence_score ?? null)
      setPhase('review')
    } catch (e) {
      const msg = e?.userMessage
        ?? 'Could not read your bill. Please try a clearer, well-lit photo — or enter your details manually.'
      setOcrError(msg)
      setPhase('error')
    }
  }, [])

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  function reset() {
    setPhase('idle')
    setPreview(null)
    setOcrError(null)
    setFields({ consumption_kwh: '', bill_amount_rm: '', account_number: '', tariff_category: '' })
    setConfidence(null)
    // reset file inputs
    if (cameraRef.current)  cameraRef.current.value  = ''
    if (galleryRef.current) galleryRef.current.value = ''
  }

  // ── navigation ─────────────────────────────────────────────────────────────

  function confirm() {
    navigate('/assess', {
      state: {
        consumption:     fields.consumption_kwh ? +fields.consumption_kwh : null,
        bill_amount_rm:  fields.bill_amount_rm  ? +fields.bill_amount_rm  : null,
        account_number:  fields.account_number  || null,
        tariff_category: fields.tariff_category || null,
        fromScan: true,
      },
    })
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <PageTransition>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">

        {/* heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#16213E' }}>Scan your TNB bill</h1>
          <p className="mt-1.5 text-gray-500 text-sm leading-relaxed">
            Take a photo or upload an image of your bill. We'll extract your usage data automatically.
          </p>
        </div>

        {/* ── IDLE: drop zone + buttons ───────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {/* drop zone */}
              <div
                ref={dropRef}
                onDrop={onDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => galleryRef.current?.click()}
                className="relative rounded-2xl border-2 border-dashed p-14 text-center cursor-pointer transition-all select-none"
                style={{
                  borderColor:     dragOver ? '#0D7377' : '#0D737755',
                  background:      dragOver ? '#E0F7F7' : '#E0F7F733',
                  transform:       dragOver ? 'scale(1.01)' : 'scale(1)',
                }}
              >
                <Upload
                  size={40}
                  className="mx-auto mb-3 transition-transform"
                  style={{ color: '#0D7377', transform: dragOver ? 'translateY(-4px)' : 'none' }}
                />
                <p className="font-semibold text-gray-700 text-base">
                  {dragOver ? 'Drop it here' : 'Drag your bill here'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  JPEG or PNG · max 10 MB
                </p>
              </div>

              {/* divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">or use</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* action buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* take photo — triggers device camera */}
                <button
                  onClick={() => cameraRef.current?.click()}
                  className="flex flex-col items-center gap-2.5 py-5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300 transition-all active:scale-95"
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                       style={{ background: '#E0F7F7' }}>
                    <Camera size={22} style={{ color: '#0D7377' }} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm text-gray-800">Take Photo</p>
                    <p className="text-xs text-gray-400 mt-0.5">Use your camera</p>
                  </div>
                </button>

                {/* upload from gallery */}
                <button
                  onClick={() => galleryRef.current?.click()}
                  className="flex flex-col items-center gap-2.5 py-5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300 transition-all active:scale-95"
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                       style={{ background: '#E0F7F7' }}>
                    <Upload size={22} style={{ color: '#0D7377' }} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm text-gray-800">Upload from Gallery</p>
                    <p className="text-xs text-gray-400 mt-0.5">Browse your files</p>
                  </div>
                </button>
              </div>

              {/* hidden file inputs */}
              <input ref={cameraRef}  type="file" accept="image/jpeg,image/png"
                     capture="environment" className="hidden"
                     onChange={e => handleFile(e.target.files[0])} />
              <input ref={galleryRef} type="file" accept="image/jpeg,image/png"
                     className="hidden"
                     onChange={e => handleFile(e.target.files[0])} />

              {/* tip */}
              <p className="mt-5 text-xs text-center text-gray-400">
                For best results: ensure the bill is flat, well-lit, and all text is in focus.
              </p>
            </motion.div>
          )}

          {/* ── SCANNING: preview + animated overlay ─────────────────────── */}
          {(phase === 'scanning' || phase === 'review' || phase === 'error') && (
            <motion.div
              key="preview-pane"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* image + overlay */}
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                <img
                  src={preview}
                  alt="Bill preview"
                  className="w-full max-h-72 object-contain"
                />
                <AnimatePresence>
                  {phase === 'scanning' && <ScanningOverlay />}
                </AnimatePresence>

                {/* reset button */}
                {phase !== 'scanning' && (
                  <button
                    onClick={reset}
                    className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* ── REVIEW: extracted fields ──────────────────────────────── */}
              <AnimatePresence>
                {phase === 'review' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* status header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2" style={{ color: '#0D7377' }}>
                        <CheckCircle size={18} />
                        <span className="font-semibold text-sm">Bill scanned — please confirm</span>
                      </div>
                      {confidence != null && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: '#E0F7F7', color: '#0D7377' }}>
                          {Math.round(confidence * 100)}% confidence
                        </span>
                      )}
                    </div>

                    {/* editable fields */}
                    <div className="rounded-2xl border p-4 space-y-3"
                         style={{ borderColor: '#0D737722', background: '#E0F7F7' }}>
                      <p className="text-xs text-gray-500 mb-1">
                        Review the extracted values — tap any field to correct it.
                      </p>

                      <EditableField
                        label="Monthly Consumption"
                        value={fields.consumption_kwh}
                        onChange={v => setFields(f => ({ ...f, consumption_kwh: v }))}
                        unit="kWh"
                        placeholder="e.g. 350"
                      />
                      <EditableField
                        label="Bill Amount"
                        value={fields.bill_amount_rm}
                        onChange={v => setFields(f => ({ ...f, bill_amount_rm: v }))}
                        unit="RM"
                        placeholder="e.g. 165.52"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <EditableField
                          label="Account Number"
                          value={fields.account_number}
                          onChange={v => setFields(f => ({ ...f, account_number: v }))}
                          placeholder="xxxx-xxxx-xxxx"
                        />
                        <EditableField
                          label="Tariff Category"
                          value={fields.tariff_category}
                          onChange={v => setFields(f => ({ ...f, tariff_category: v }))}
                          placeholder="e.g. Domestic"
                        />
                      </div>
                    </div>

                    {/* primary CTA */}
                    <button
                      onClick={confirm}
                      disabled={!fields.consumption_kwh}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: '#0D7377' }}
                    >
                      <CheckCircle size={18} />
                      Looks correct! Continue
                      <ArrowRight size={16} />
                    </button>

                    {/* secondary */}
                    <div className="flex items-center justify-between text-sm">
                      <button
                        onClick={reset}
                        className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <RefreshCw size={13} /> Scan again
                      </button>
                      <Link to="/assess"
                        className="font-medium hover:underline"
                        style={{ color: '#0D7377' }}>
                        Enter manually instead →
                      </Link>
                    </div>
                  </motion.div>
                )}

                {/* ── ERROR state ──────────────────────────────────────────── */}
                {phase === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
                      <div className="flex items-start gap-3">
                        <AlertCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-red-700 text-sm">Couldn't read this bill</p>
                          <p className="text-sm text-red-600 mt-1 leading-relaxed">{ocrError}</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500 text-center leading-relaxed">
                      This can happen with low-light photos, glare, or unusual bill formats.
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={reset}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all active:scale-95"
                      >
                        <RefreshCw size={15} /> Try again
                      </button>
                      <Link
                        to="/assess"
                        className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                        style={{ background: '#0D7377' }}
                      >
                        Enter manually <ArrowRight size={15} />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* bottom note */}
        {phase === 'idle' && (
          <p className="mt-6 text-xs text-center text-gray-300">
            Images are sent to our local server for OCR processing and are never stored.
          </p>
        )}
      </div>
    </PageTransition>
  )
}
