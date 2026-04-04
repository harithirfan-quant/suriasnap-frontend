import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, ImageIcon, AlertCircle, CheckCircle2, ArrowRight, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { scanBill } from '../lib/api'
import PageTransition from '../components/PageTransition'

export default function Scan() {
  const [file,     setFile]     = useState(null)
  const [preview,  setPreview]  = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState(null)
  const [error,    setError]    = useState(null)
  const inputRef = useRef()
  const navigate = useNavigate()

  function handleFile(f) {
    if (!f) return
    if (!['image/jpeg', 'image/png'].includes(f.type)) {
      setError('Please upload a JPEG or PNG image of your TNB bill.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File must be under 10 MB.')
      return
    }
    setError(null)
    setResult(null)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function onDrop(e) {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  function clear() {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function extract() {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const data = await scanBill(file)
      setResult(data)
    } catch (e) {
      setError(e?.response?.data?.detail ?? 'Failed to scan bill. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function proceed() {
    navigate('/assess', {
      state: { consumption: result?.consumption_kwh ?? null },
    })
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#16213E' }}>Scan your TNB bill</h1>
          <p className="mt-1 text-gray-500">
            Upload a clear photo of your bill. We'll extract your monthly consumption automatically.
          </p>
        </div>

        {/* Drop zone */}
        {!preview && (
          <div
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors hover:border-teal-400"
            style={{ borderColor: '#0D7377' + '55', background: '#E0F7F744' }}
          >
            <Upload size={36} className="mx-auto mb-3" style={{ color: '#0D7377' }} />
            <p className="font-medium text-gray-700">Drop your bill image here</p>
            <p className="text-sm text-gray-400 mt-1">or click to browse · JPEG or PNG · max 10 MB</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={e => handleFile(e.target.files[0])}
            />
          </div>
        )}

        {/* Preview */}
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
            >
              <button
                onClick={clear}
                className="absolute top-3 right-3 z-10 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
              >
                <X size={16} />
              </button>
              <img src={preview} alt="Bill preview" className="w-full max-h-96 object-contain bg-gray-50" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* OCR result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 rounded-2xl border p-5 space-y-3"
              style={{ borderColor: '#0D737733', background: '#E0F7F7' }}
            >
              <div className="flex items-center gap-2 font-semibold" style={{ color: '#0D7377' }}>
                {result.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {result.success ? 'Bill scanned successfully' : 'Partial scan — some fields missing'}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Monthly Consumption', result.consumption_kwh ? `${result.consumption_kwh} kWh` : '—'],
                  ['Bill Amount',         result.bill_amount_rm   ? `RM ${result.bill_amount_rm.toFixed(2)}` : '—'],
                  ['Account Number',      result.account_number  ?? '—'],
                  ['Tariff Category',     result.tariff_category ?? '—'],
                ].map(([label, val]) => (
                  <div key={label} className="bg-white rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="font-semibold text-sm" style={{ color: '#16213E' }}>{val}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Confidence: {Math.round(result.confidence_score * 100)}%
                </span>
                <span className="text-xs text-gray-400">{result.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="mt-5 flex gap-3">
          {file && !result && (
            <button
              onClick={extract}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
              style={{ background: '#0D7377' }}
            >
              {loading
                ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><ImageIcon size={18} /> Extract from Bill</>
              }
            </button>
          )}

          {(result || error) && (
            <button
              onClick={proceed}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: '#0D7377' }}
            >
              Continue to Assessment <ArrowRight size={18} />
            </button>
          )}
        </div>

        <p className="mt-4 text-xs text-center text-gray-400">
          Images are processed locally and are not stored on our servers.
        </p>
      </div>
    </PageTransition>
  )
}
