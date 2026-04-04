import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ScanLine, FileText, Leaf, FlaskConical, X, ArrowRight } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import DEMO_SCENARIOS from '../data/demoData'

const features = [
  {
    icon: ScanLine,
    title: 'Scan Your TNB Bill',
    desc:  'Photograph your electricity bill and we extract your usage automatically.',
  },
  {
    icon: Zap,
    title: 'Instant Solar Sizing',
    desc:  'Get a recommended system size based on your roof and real Malaysian GHI data.',
  },
  {
    icon: FileText,
    title: 'Detailed PDF Report',
    desc:  'Download a full assessment with financials, payback period, and next steps.',
  },
  {
    icon: Leaf,
    title: 'Environmental Impact',
    desc:  'See your CO₂ savings and tree-equivalent offset every year.',
  },
]

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
}
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ─── Demo picker modal ────────────────────────────────────────────────────────

function DemoModal({ onClose }) {
  const navigate = useNavigate()

  function launch(scenario) {
    onClose()
    navigate('/result', {
      state: {
        result: scenario.result,
        inputs: {
          state:                   scenario.inputs.state,
          monthly_consumption_kwh: scenario.inputs.monthly_consumption_kwh,
          roof_area_sqm:           scenario.inputs.roof_area_sqm,
          roof_orientation:        scenario.inputs.roof_orientation,
        },
        isDemo: true,
      },
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(22,33,62,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        exit={{    opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: '#E0F7F7' }}>
              <FlaskConical size={16} style={{ color: '#0D7377' }} />
            </div>
            <div>
              <p className="font-bold text-base" style={{ color: '#16213E' }}>Try a Demo</p>
              <p className="text-xs text-gray-400">No internet needed · instant results</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* scenario cards */}
        <div className="px-4 pb-6 space-y-2.5">
          {DEMO_SCENARIOS.map((s, i) => {
            const annualSav = Math.round(s.result.monthly_savings_rm * 12)
            return (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => launch(s)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-teal-200 hover:shadow-md text-left transition-all active:scale-98 group"
              >
                <span className="text-3xl">{s.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm" style={{ color: '#16213E' }}>{s.label}</p>
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: '#E0F7F7', color: '#0D7377' }}>
                      {s.tag}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{s.desc}</p>
                  <p className="text-xs mt-1 font-medium" style={{ color: '#0D7377' }}>
                    Saves RM {annualSav.toLocaleString()}/yr · {s.result.payback_years} yr payback
                  </p>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-teal-500 transition-colors shrink-0" />
              </motion.button>
            )
          })}
        </div>

        {/* footer note */}
        <div className="px-6 pb-5 pt-1 border-t border-gray-50">
          <p className="text-xs text-center text-gray-400">
            Demo results are pre-calculated using the same engine as the live app.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Home page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [showDemo, setShowDemo] = useState(false)

  return (
    <PageTransition>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ background: '#16213E' }}>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
             style={{ background: '#0D7377' }} />
        <div className="absolute bottom-0 -left-16 w-64 h-64 rounded-full opacity-5"
             style={{ background: '#14BDBD' }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center">
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="flex flex-col items-center gap-5"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
                    style={{ color: '#14BDBD', borderColor: '#14BDBD33', background: '#14BDBD11' }}>
                Solar ATAP · NEM Scheme · Malaysia
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-3xl">
              Find out if your roof is{' '}
              <span style={{ color: '#14BDBD' }}>ready for solar</span>
            </motion.h1>

            <motion.p variants={fadeUp}
              className="text-lg text-gray-400 max-w-xl leading-relaxed">
              Enter your electricity details and get an instant, data-backed assessment
              of savings, payback period, and environmental impact — built for Malaysian homes.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mt-2">
              <Link to="/scan"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ background: '#0D7377' }}>
                <ScanLine size={18} />
                Scan My TNB Bill
              </Link>
              <Link to="/assess"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border border-gray-600 text-gray-200 transition-all hover:border-gray-400 hover:text-white active:scale-95">
                Enter Details Manually
              </Link>
            </motion.div>

            {/* subtle demo button */}
            <motion.div variants={fadeUp}>
              <button
                onClick={() => setShowDemo(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-white/10 active:scale-95"
                style={{ color: '#6B7280', border: '1px dashed #374151' }}
              >
                <FlaskConical size={13} />
                Try Demo
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: '#16213E' }}>
            How SuriaSnap works
          </h2>
          <p className="mt-3 text-gray-500">From bill to decision in under a minute.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                   style={{ background: '#E0F7F7' }}>
                <Icon size={20} style={{ color: '#0D7377' }} />
              </div>
              <h3 className="font-semibold text-base mb-1.5" style={{ color: '#16213E' }}>
                {title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="border-t border-gray-100" style={{ background: '#E0F7F7' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-wrap justify-center gap-x-10 gap-y-3">
          {['Global Solar Atlas GHI data', 'TNB tariff rates 2024', 'SEDA Solar ATAP NEM scheme', 'Tesseract OCR bill scanning'].map(t => (
            <span key={t} className="text-sm font-medium flex items-center gap-1.5"
                  style={{ color: '#0D7377' }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#0D7377' }} />
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ── Demo modal ── */}
      <AnimatePresence>
        {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}
      </AnimatePresence>
    </PageTransition>
  )
}
