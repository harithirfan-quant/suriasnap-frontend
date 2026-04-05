import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Coins, Clock, Leaf, TrendingUp, Download,
  ExternalLink, Share2, RefreshCw, Zap, Sun,
  CheckCircle, X, Copy, FlaskConical, ChevronDown, Languages,
} from 'lucide-react'
import { downloadReport } from '../services/api'
import ShareCardComponent from '../components/ShareCard'

// ─── design tokens ────────────────────────────────────────────────────────────
const TEAL   = '#0D7377'
const TEAL_L = '#14BDBD'
const DARK   = '#16213E'
const SURF   = '#E0F7F7'

// ─── translations ─────────────────────────────────────────────────────────────
const T = {
  en: {
    keyMetrics: 'Key Metrics', keyMetricsSub: 'Calculated using TNB tariff rates and real Malaysian GHI data',
    monthlySavings: 'Monthly Savings', payback: 'Payback Period', co2Offset: 'CO₂ Offset', roi: '25-Year ROI',
    billComparison: 'Bill Comparison', billComparisonSub: 'Your estimated monthly bill — before and after solar',
    currentBill: 'Current Bill', withSolar: 'With Solar', saving: 'You save',
    recSystem: 'Recommended System', recSystemSub: 'Sized for your roof area and consumption',
    finBreakdown: 'Financial Breakdown', finBreakdownSub: 'How your monthly savings are composed',
    environmental: 'Environmental Impact', environmentalSub: 'Your contribution to a greener Malaysia',
    co2Hero: 'Annual CO₂ Offset', co2Total: 'tonnes of CO₂ per year',
    equivLabel: "That's equivalent to…",
    treesLabel: 'trees planted', treesLabelSub: 'every year',
    drivingLabel: 'km of driving avoided', drivingLabelSub: 'per year',
    flightsLabel: 'KL–Penang flights', flightsLabelSub: 'offset per year',
    chargesLabel: 'phone charges', chargesLabelSub: 'powered by clean energy',
    methodology: 'About the Data', methodologySub: 'How we calculate your solar assessment',
    readyTitle: 'Ready to go solar?',
    disclaimer: 'Estimates are based on Global Solar Atlas GHI data, TNB residential tariff (2025/2026), SEDA Solar ATAP export rate, and standard panel efficiency of 21%. Actual results may vary. Always obtain quotes from multiple SEDA-registered installers.',
  },
  bm: {
    keyMetrics: 'Metrik Utama', keyMetricsSub: 'Dikira menggunakan kadar tarif TNB dan data GHI Malaysia sebenar',
    monthlySavings: 'Penjimatan Bulanan', payback: 'Tempoh Pulang Modal', co2Offset: 'Offset CO₂', roi: 'ROI 25 Tahun',
    billComparison: 'Perbandingan Bil', billComparisonSub: 'Anggaran bil bulanan anda — sebelum dan selepas solar',
    currentBill: 'Bil Semasa', withSolar: 'Dengan Solar', saving: 'Anda jimat',
    recSystem: 'Sistem Dicadangkan', recSystemSub: 'Disesuaikan dengan saiz bumbung dan penggunaan anda',
    finBreakdown: 'Pecahan Kewangan', finBreakdownSub: 'Bagaimana penjimatan bulanan anda dikomposkan',
    environmental: 'Impak Alam Sekitar', environmentalSub: 'Sumbangan anda untuk Malaysia yang lebih hijau',
    co2Hero: 'Offset CO₂ Tahunan', co2Total: 'tan CO₂ setahun',
    equivLabel: 'Bersamaan dengan…',
    treesLabel: 'pokok ditanam', treesLabelSub: 'setiap tahun',
    drivingLabel: 'km memandu dielakkan', drivingLabelSub: 'setahun',
    flightsLabel: 'penerbangan KL–Pulau Pinang', flightsLabelSub: 'diimbangi setahun',
    chargesLabel: 'cas telefon', chargesLabelSub: 'dikuasakan tenaga bersih',
    methodology: 'Tentang Data', methodologySub: 'Bagaimana kami mengira penilaian solar anda',
    readyTitle: 'Bersedia untuk solar?',
    disclaimer: 'Anggaran berdasarkan data GHI Global Solar Atlas, tarif kediaman TNB (2025/2026), kadar eksport SEDA Solar ATAP, dan kecekapan panel piawai 21%. Keputusan sebenar mungkin berbeza. Sentiasa dapatkan sebut harga daripada pemasang berdaftar SEDA.',
  },
}

// ─── rough TNB bill estimator (for comparison chart) ─────────────────────────
function estimateTNBBill(kwh) {
  const energy   = kwh <= 600 ? kwh * 0.2703 : 600 * 0.2703 + (kwh - 600) * 0.3703
  const capacity = kwh * 0.0455
  const network  = kwh * 0.1285
  const retail   = kwh >= 600 ? 10 : 0
  return +(energy + capacity + network + retail).toFixed(2)
}

// ─── animated counter hook ────────────────────────────────────────────────────
function useCounter(target, duration = 1800, start = false) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!start || target === 0) return
    let startTime = null
    const ease = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2  // ease-in-out cubic
    function frame(ts) {
      if (!startTime) startTime = ts
      const pct = Math.min((ts - startTime) / duration, 1)
      setValue(Math.round(ease(pct) * target))
      if (pct < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [target, duration, start])
  return value
}

// ─── scroll-reveal wrapper ────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px 0px' })
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}

// ─── section heading ──────────────────────────────────────────────────────────
function SectionHeading({ children, sub }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl sm:text-2xl font-bold" style={{ color: DARK }}>{children}</h2>
      {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

// ─── metric card ──────────────────────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, unit, sub, accent = false, delay = 0 }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px 0px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: accent ? `linear-gradient(135deg, ${TEAL}, #0a5c60)` : '#fff',
        border: accent ? 'none' : '1px solid #F3F4F6',
        boxShadow: accent
          ? `0 8px 32px ${TEAL}40`
          : '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      {/* background glow for accent card */}
      {accent && (
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
             style={{ background: TEAL_L }} />
      )}
      <div className="flex items-center justify-between relative">
        <span className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: accent ? TEAL_L : '#9CA3AF' }}>
          {label}
        </span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
             style={{ background: accent ? 'rgba(255,255,255,0.15)' : SURF }}>
          <Icon size={18} style={{ color: accent ? '#fff' : TEAL }} />
        </div>
      </div>
      <div className="relative">
        <p className="text-3xl font-bold leading-none"
           style={{ color: accent ? '#fff' : DARK }}>
          {value}
          {unit && <span className="text-lg ml-1 font-medium"
                         style={{ color: accent ? TEAL_L : '#6B7280' }}>{unit}</span>}
        </p>
        {sub && (
          <p className="text-xs mt-2" style={{ color: accent ? TEAL_L : '#9CA3AF' }}>{sub}</p>
        )}
      </div>
    </motion.div>
  )
}

// ─── financial row ────────────────────────────────────────────────────────────
function FinRow({ label, value, sub, highlight, last }) {
  return (
    <div className={`flex items-center justify-between py-3.5 ${last ? '' : 'border-b border-gray-50'}`}>
      <div>
        <p className="text-sm text-gray-700">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <p className="text-sm font-bold tabular-nums"
         style={{ color: highlight ? TEAL : DARK }}>
        {value}
      </p>
    </div>
  )
}

// ─── toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <motion.div
      initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium text-white"
      style={{ background: DARK }}
    >
      <CheckCircle size={16} style={{ color: TEAL_L }} />
      {msg}
      <button onClick={onClose} className="ml-1 opacity-50 hover:opacity-100"><X size={14}/></button>
    </motion.div>
  )
}

// ─── empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
           style={{ background: SURF }}>
        <Sun size={32} style={{ color: TEAL }} />
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: DARK }}>No assessment yet</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-xs">
        Complete the assessment to see your solar potential and savings.
      </p>
      <button onClick={() => navigate('/assess')}
        className="px-6 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90 active:scale-95"
        style={{ background: TEAL }}>
        Start Assessment
      </button>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────
export default function ResultPage() {
  const { state }  = useLocation()
  const navigate    = useNavigate()
  const heroRef    = useRef(null)
  const heroInView = useInView(heroRef, { once: true })

  const [toast,           setToast]           = useState(null)
  const [pdfLoading,      setPdfLoading]      = useState(false)
  const [lang,            setLang]            = useState('en')
  const [methodologyOpen, setMethodologyOpen] = useState(false)

  const t = key => T[lang][key]

  const showToast = useCallback(msg => setToast(msg), [])

  if (!state?.result) return <EmptyState />

  const { result: r, inputs, isDemo } = state

  // ── derived values ──────────────────────────────────────────────────────────
  const annualSavings = Math.round(r.monthly_savings_rm * 12)
  const co2Tonnes     = (r.annual_co2_offset_kg / 1000).toFixed(2)
  const trees         = Math.floor(r.annual_co2_offset_kg / 22)
  const drivingKm     = Math.round(r.annual_co2_offset_kg / 0.21)          // avg car 0.21 kg CO₂/km
  const flights       = Math.round(r.annual_co2_offset_kg / 100)            // KL–Penang ~100 kg CO₂/pax
  const phoneCharges  = Math.round(r.annual_co2_offset_kg / 0.00822)        // avg phone charge ~8.22 g CO₂
  const exportKwh     = Math.max(0, r.monthly_generation_kwh - inputs.monthly_consumption_kwh)
  const exportCredits = +(exportKwh * 0.2703).toFixed(2)
  const selfSavings   = +(r.monthly_savings_rm - exportCredits).toFixed(2)
  const roiK          = (r.roi_25_year_rm / 1000).toFixed(0)
  const currentBill   = estimateTNBBill(inputs.monthly_consumption_kwh)
  const solarBill     = Math.max(0, +(currentBill - r.monthly_savings_rm).toFixed(2))
  const billSavingPct = Math.round(((currentBill - solarBill) / currentBill) * 100)

  // ── animated counter (starts when hero is in view) ──────────────────────────
  const animatedSavings = useCounter(annualSavings, 2000, heroInView)

  // ── PDF download ────────────────────────────────────────────────────────────
  async function downloadPdf() {
    setPdfLoading(true)
    try {
      const blob = await downloadReport({
        state:                   inputs.state,
        monthly_consumption_kwh: +inputs.monthly_consumption_kwh,
        roof_area_sqm:           +inputs.roof_area_sqm,
        roof_orientation:        inputs.roof_orientation,
      })
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const a   = Object.assign(document.createElement('a'), { href: url, download: 'suriasnap-report.pdf' })
      a.click()
      URL.revokeObjectURL(url)
      showToast('PDF downloaded!')
    } catch (e) {
      showToast(e?.userMessage ?? 'Failed to generate PDF — is the backend running?')
    } finally {
      setPdfLoading(false)
    }
  }

  // ── copy link ───────────────────────────────────────────────────────────────
  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => showToast('Link copied!'))
  }

  // ─── render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* off-screen share card */}
      <div className="w-full">

        {/* ── Demo banner ───────────────────────────────────────────────────── */}
        {isDemo && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium"
               style={{ background: '#FEF9C3', color: '#92400E', borderBottom: '1px solid #FDE68A' }}>
            <FlaskConical size={13} />
            Demo mode — pre-calculated results · no internet required
          </div>
        )}

        {/* ── § 1  HERO ─────────────────────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${DARK} 0%, #0f3460 50%, ${TEAL} 100%)` }}
        >
          {/* decorative rings */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[320, 480, 640].map((s, i) => (
              <div key={i}
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: s, height: s, borderRadius: '50%',
                  border: `1px solid rgba(255,255,255,${0.04 - i * 0.01})`,
                  transform: 'translate(-50%, -50%)',
                }} />
            ))}
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl"
                 style={{ background: TEAL_L, transform: 'translate(30%, -30%)' }} />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl"
                 style={{ background: TEAL, transform: 'translate(-30%, 30%)' }} />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-6"
                    style={{ background: 'rgba(255,255,255,0.1)', color: TEAL_L, border: `1px solid ${TEAL_L}44` }}>
                <Zap size={11} fill={TEAL_L} /> {inputs.state} · {inputs.roof_orientation}-facing · {inputs.roof_area_sqm} m²
              </span>
            </motion.div>

            <motion.p className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              You could save
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 120 }}
              className="mb-2"
            >
              <span className="text-5xl sm:text-7xl font-black text-white tabular-nums">
                RM {animatedSavings.toLocaleString()}
              </span>
              <span className="block text-lg sm:text-xl font-medium mt-1" style={{ color: TEAL_L }}>
                per year
              </span>
            </motion.div>

            <motion.p className="text-gray-300 text-base sm:text-lg mt-3"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              with a <strong className="text-white">{r.recommended_system_kwp} kWp</strong> solar system
              ({r.num_panels_400w} × 400W panels)
            </motion.p>

            {/* hero mini-stats */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
              className="flex flex-wrap justify-center gap-6 mt-10"
            >
              {[
                ['Payback', `${r.payback_years} yrs`],
                ['25-Yr ROI', `RM ${roiK}k`],
                ['CO₂/yr', `${co2Tonnes} t`],
              ].map(([l, v]) => (
                <div key={l} className="text-center">
                  <p className="text-2xl font-bold text-white">{v}</p>
                  <p className="text-xs mt-0.5" style={{ color: TEAL_L }}>{l}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── content ────────────────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-14">

          {/* toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 -mt-4">
            <button onClick={() => navigate('/assess')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all">
              <RefreshCw size={13} /> Recalculate
            </button>
            <div className="flex gap-2">
              {/* language toggle */}
              <button
                onClick={() => setLang(l => l === 'en' ? 'bm' : 'en')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-all"
                style={{
                  borderColor: lang === 'bm' ? TEAL : '#E5E7EB',
                  background:  lang === 'bm' ? SURF  : '#fff',
                  color:       lang === 'bm' ? TEAL  : '#6B7280',
                }}
              >
                <Languages size={13} /> {lang === 'en' ? 'BM' : 'EN'}
              </button>
              <button onClick={copyLink}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all">
                <Copy size={13} /> Copy link
              </button>
              <ShareCardComponent result={r} inputs={inputs} />
              <button onClick={downloadPdf} disabled={pdfLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: TEAL }}>
                {pdfLoading
                  ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Download size={13} />
                } Download PDF
              </button>
            </div>
          </div>

          {/* ── § 2  METRIC CARDS ─────────────────────────────────────────── */}
          <section>
            <Reveal><SectionHeading sub={t('keyMetricsSub')}>{t('keyMetrics')}</SectionHeading></Reveal>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                icon={Coins} label={t('monthlySavings')}
                value={`RM ${r.monthly_savings_rm.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                sub="Avg. based on TNB tariff" accent delay={0} />
              <MetricCard
                icon={Clock} label={t('payback')}
                value={r.payback_years} unit={lang === 'en' ? 'years' : 'tahun'}
                sub="Simple payback" delay={0.08} />
              <MetricCard
                icon={Leaf} label={t('co2Offset')}
                value={co2Tonnes} unit="t/yr"
                sub={`${trees.toLocaleString()} ${lang === 'en' ? 'trees equivalent' : 'setara pokok'}`} delay={0.16} />
              <MetricCard
                icon={TrendingUp} label={t('roi')}
                value={`RM ${roiK}k`}
                sub={lang === 'en' ? 'Net after system cost' : 'Bersih selepas kos sistem'} delay={0.24} />
            </div>
          </section>

          {/* ── § 3  BILL COMPARISON ──────────────────────────────────────── */}
          <section>
            <Reveal><SectionHeading sub={t('billComparisonSub')}>{t('billComparison')}</SectionHeading></Reveal>
            <Reveal delay={0.05}>
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 sm:p-8">
                {/* bar chart */}
                <div className="flex items-end gap-6 sm:gap-10 justify-center mb-6">
                  {/* Current bill bar */}
                  <div className="flex flex-col items-center gap-2 flex-1 max-w-[160px]">
                    <p className="text-lg font-bold tabular-nums" style={{ color: '#EF4444' }}>
                      RM {currentBill.toFixed(2)}
                    </p>
                    <motion.div
                      className="w-full rounded-t-xl"
                      style={{ background: 'linear-gradient(180deg,#FCA5A5,#EF4444)', minHeight: 8 }}
                      initial={{ height: 0 }}
                      whileInView={{ height: 160 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                    <p className="text-xs font-semibold text-gray-500">{t('currentBill')}</p>
                  </div>

                  {/* Arrow + savings badge */}
                  <div className="flex flex-col items-center gap-1 pb-8">
                    <div className="px-3 py-1.5 rounded-full text-xs font-bold text-white"
                         style={{ background: TEAL }}>
                      -{billSavingPct}%
                    </div>
                    <div className="text-2xl text-gray-300">→</div>
                  </div>

                  {/* With solar bar */}
                  <div className="flex flex-col items-center gap-2 flex-1 max-w-[160px]">
                    <p className="text-lg font-bold tabular-nums" style={{ color: TEAL }}>
                      RM {solarBill.toFixed(2)}
                    </p>
                    <motion.div
                      className="w-full rounded-t-xl"
                      style={{ background: `linear-gradient(180deg,${TEAL_L},${TEAL})`, minHeight: 8 }}
                      initial={{ height: 0 }}
                      whileInView={{ height: Math.max(8, 160 * (solarBill / currentBill)) }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
                    />
                    <p className="text-xs font-semibold text-gray-500">{t('withSolar')}</p>
                  </div>
                </div>

                {/* summary line */}
                <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl"
                     style={{ background: SURF }}>
                  <Coins size={16} style={{ color: TEAL }} />
                  <p className="text-sm font-semibold" style={{ color: TEAL }}>
                    {t('saving')} <span className="text-base font-black">RM {r.monthly_savings_rm.toFixed(2)}</span>
                    {lang === 'en' ? ' every month' : ' setiap bulan'}
                  </p>
                </div>
              </div>
            </Reveal>
          </section>

          {/* ── § 4  SYSTEM DETAILS ───────────────────────────────────────── */}
          <section>
            <Reveal><SectionHeading sub={t('recSystemSub')}>{t('recSystem')}</SectionHeading></Reveal>
            <Reveal delay={0.1}>
              <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                {/* header strip */}
                <div className="px-6 py-4 flex items-center justify-between"
                     style={{ background: `linear-gradient(90deg, ${DARK}, #0f3460)` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                         style={{ background: TEAL }}>
                      <Sun size={20} color="#fff" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{r.recommended_system_kwp} kWp System</p>
                      <p className="text-xs" style={{ color: TEAL_L }}>Solar ATAP / NEM eligible</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Estimated cost</p>
                    <p className="text-xl font-bold text-white">RM {r.system_cost_rm.toLocaleString()}</p>
                  </div>
                </div>

                {/* stats row */}
                <div className="grid grid-cols-3 divide-x divide-gray-100">
                  {[
                    ['System Size', `${r.recommended_system_kwp} kWp`, 'Kilowatt-peak'],
                    ['Panel Count', `${r.num_panels_400w}`, '400W monocrystalline'],
                    ['Monthly Generation', `${r.monthly_generation_kwh.toLocaleString()} kWh`, 'Est. per month'],
                  ].map(([label, value, hint]) => (
                    <div key={label} className="p-5 bg-white">
                      <p className="text-xs text-gray-400 mb-1">{label}</p>
                      <p className="text-2xl font-bold" style={{ color: DARK }}>{value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </section>

          {/* ── § 5  FINANCIAL BREAKDOWN ──────────────────────────────────── */}
          <section>
            <Reveal><SectionHeading sub={t('finBreakdownSub')}>{t('finBreakdown')}</SectionHeading></Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              <Reveal delay={0.05} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
                <p className="text-sm font-semibold mb-4" style={{ color: DARK }}>Monthly savings breakdown</p>
                <FinRow label="Monthly generation" value={`${r.monthly_generation_kwh.toLocaleString()} kWh`}
                        sub="Based on GHI, orientation & PR" />
                <FinRow label="Self-consumption savings"
                        value={`RM ${selfSavings > 0 ? selfSavings.toFixed(2) : r.monthly_savings_rm.toFixed(2)}`}
                        sub="Offset from TNB bill" highlight />
                {exportCredits > 0 && (
                  <FinRow label="Solar ATAP export credits"
                          value={`RM ${exportCredits.toFixed(2)}`}
                          sub={`${exportKwh.toFixed(0)} kWh × RM 0.2703`} highlight />
                )}
                <FinRow label="Total monthly savings" value={`RM ${r.monthly_savings_rm.toFixed(2)}`}
                        highlight last />
              </Reveal>

              <Reveal delay={0.1} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
                <p className="text-sm font-semibold mb-4" style={{ color: DARK }}>Lifetime projections</p>
                <FinRow label="Annual savings (Year 1)" value={`RM ${annualSavings.toLocaleString()}`} highlight />
                <FinRow label="System cost" value={`RM ${r.system_cost_rm.toLocaleString()}`} />
                <FinRow label="Simple payback period" value={`${r.payback_years} years`} />
                <FinRow label="25-year gross savings"
                        value={`RM ${(r.roi_25_year_rm + r.system_cost_rm).toLocaleString()}`}
                        sub="Before deducting system cost" />
                <FinRow label="25-year net ROI" value={`RM ${r.roi_25_year_rm.toLocaleString()}`}
                        highlight last />
              </Reveal>
            </div>
          </section>

          {/* ── § 6  ENVIRONMENTAL IMPACT ─────────────────────────────────── */}
          <section>
            <Reveal><SectionHeading sub={t('environmentalSub')}>{t('environmental')}</SectionHeading></Reveal>
            <Reveal delay={0.05}>
              <div className="rounded-2xl overflow-hidden"
                   style={{ background: 'linear-gradient(135deg, #052e16, #064e3b)' }}>
                <div className="p-7 sm:p-10">

                  {/* Hero CO₂ stat */}
                  <div className="text-center mb-8">
                    <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                       style={{ color: '#86efac' }}>{t('co2Hero')}</p>
                    <p className="text-7xl sm:text-8xl font-black text-white leading-none">{co2Tonnes}</p>
                    <p className="text-xl font-semibold mt-2" style={{ color: '#86efac' }}>{t('co2Total')}</p>
                    <p className="text-sm mt-1" style={{ color: '#4ade80', opacity: 0.7 }}>
                      {(parseFloat(co2Tonnes) * 25).toFixed(0)} {lang === 'en' ? 'tonnes over 25 years' : 'tan dalam 25 tahun'}
                    </p>
                  </div>

                  {/* "That's equivalent to…" cards */}
                  <p className="text-xs font-semibold uppercase tracking-widest text-center mb-4"
                     style={{ color: '#86efac' }}>{t('equivLabel')}</p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      { emoji: '🌲', value: trees.toLocaleString(),                           label: t('treesLabel'),   sub: t('treesLabelSub') },
                      { emoji: '🚗', value: drivingKm.toLocaleString(),                       label: t('drivingLabel'), sub: t('drivingLabelSub') },
                      { emoji: '✈️', value: flights.toLocaleString(),                          label: t('flightsLabel'), sub: t('flightsLabelSub') },
                      { emoji: '📱', value: phoneCharges >= 1_000_000
                                              ? `${(phoneCharges / 1_000_000).toFixed(1)}M`
                                              : phoneCharges.toLocaleString(),                 label: t('chargesLabel'), sub: t('chargesLabelSub') },
                    ].map(({ emoji, value, label, sub }, i) => (
                      <motion.div
                        key={label}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08, duration: 0.35 }}
                        className="rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center"
                        style={{ background: 'rgba(255,255,255,0.08)' }}
                      >
                        <span className="text-4xl mb-2">{emoji}</span>
                        <p className="text-2xl sm:text-3xl font-black text-white leading-none">{value}</p>
                        <p className="text-xs font-semibold mt-1.5" style={{ color: '#86efac' }}>{label}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#4ade80', opacity: 0.6 }}>{sub}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Tree grid — compact */}
                  <div className="bg-black/20 rounded-2xl p-5">
                    <p className="text-xs text-green-300 mb-3 font-medium">
                      🌲 {trees.toLocaleString()} trees planted equivalent
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: Math.min(trees, 60) }).map((_, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.012, duration: 0.2 }}
                          style={{ fontSize: '15px' }}
                        >🌲</motion.span>
                      ))}
                      {trees > 60 && (
                        <span className="text-green-300 text-sm font-semibold self-center ml-2">
                          +{(trees - 60).toLocaleString()} more
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-green-400/60 mt-3">
                      Tree: 22 kg CO₂/yr · Car: 0.21 kg CO₂/km · Flight: ~100 kg CO₂/pax (KL–Penang) · Grid: 0.585 kgCO₂/kWh (Suruhanjaya Tenaga)
                    </p>
                  </div>

                </div>
              </div>
            </Reveal>
          </section>

          {/* ── § 7  METHODOLOGY ─────────────────────────────────────────── */}
          <section>
            <Reveal>
              <button
                onClick={() => setMethodologyOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-gray-200 bg-white shadow-sm hover:border-gray-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                       style={{ background: SURF }}>
                    <FlaskConical size={17} style={{ color: TEAL }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold" style={{ color: DARK }}>{t('methodology')}</p>
                    <p className="text-xs text-gray-400">{t('methodologySub')}</p>
                  </div>
                </div>
                <motion.div animate={{ rotate: methodologyOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={18} className="text-gray-400" />
                </motion.div>
              </button>

              <AnimatePresence>
                {methodologyOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 rounded-2xl border border-gray-100 bg-white shadow-sm p-6 space-y-5 text-sm">

                      {/* Data Sources */}
                      <div>
                        <p className="font-bold mb-2" style={{ color: DARK }}>
                          {lang === 'en' ? '📡 Data Sources' : '📡 Sumber Data'}
                        </p>
                        <ul className="space-y-1.5 text-gray-600 text-xs leading-relaxed">
                          <li>• <strong>Solar irradiance (GHI)</strong> — Global Solar Atlas, per-state averages for Malaysia</li>
                          <li>• <strong>TNB tariff</strong> — Residential Schedule D (2025/2026): RM 0.2703/kWh (≤600 kWh), RM 0.3703/kWh (&gt;600 kWh)</li>
                          <li>• <strong>Solar ATAP export rate</strong> — SEDA Net Energy Metering: RM 0.2703/kWh</li>
                          <li>• <strong>CO₂ emission factor</strong> — 0.585 kgCO₂/kWh (Suruhanjaya Tenaga Malaysia)</li>
                          <li>• <strong>System cost</strong> — Industry average RM 4,000/kWp (installed, 2025)</li>
                        </ul>
                      </div>

                      {/* Assumptions */}
                      <div>
                        <p className="font-bold mb-2" style={{ color: DARK }}>
                          {lang === 'en' ? '⚙️ Key Assumptions' : '⚙️ Andaian Utama'}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            ['Panel Efficiency', '21% (monocrystalline)'],
                            ['Performance Ratio', '0.80 (industry standard)'],
                            ['Area Utilisation', '70% of roof usable'],
                            ['Panel Size', '400W per panel'],
                            ['Degradation', '0.5% per year'],
                            ['Projection Period', '25 years'],
                          ].map(([k, v]) => (
                            <div key={k} className="rounded-xl p-3" style={{ background: '#F9FAFB' }}>
                              <p className="text-xs text-gray-400">{k}</p>
                              <p className="font-semibold text-xs mt-0.5" style={{ color: DARK }}>{v}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Limitations */}
                      <div>
                        <p className="font-bold mb-2" style={{ color: DARK }}>
                          {lang === 'en' ? '⚠️ Limitations' : '⚠️ Had Batasan'}
                        </p>
                        <ul className="space-y-1.5 text-gray-600 text-xs leading-relaxed">
                          <li>• Results are estimates — actual generation varies with shading, roof pitch, and local microclimate</li>
                          <li>• Tariff rates may change; always verify with TNB and your installer</li>
                          <li>• System cost varies by brand, installer, and location — get at least 3 quotes</li>
                          <li>• NEM eligibility subject to TNB grid capacity approval in your area</li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Reveal>
          </section>

          {/* ── § 8  CALL TO ACTION ───────────────────────────────────────── */}
          <section>
            <Reveal><SectionHeading>{t('readyTitle')}</SectionHeading></Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Download Report */}
              <Reveal delay={0} className="rounded-2xl p-6 flex flex-col gap-4"
                      style={{ background: TEAL }}>
                <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center">
                  <Download size={22} color="#fff" />
                </div>
                <div>
                  <p className="text-white font-bold text-base mb-1">Download Report</p>
                  <p className="text-sm" style={{ color: TEAL_L }}>
                    Full PDF with financials, system specs, and next steps.
                  </p>
                </div>
                <button
                  onClick={downloadPdf}
                  disabled={pdfLoading}
                  className="mt-auto flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-sm font-semibold transition-all hover:bg-opacity-90 active:scale-95 disabled:opacity-60"
                  style={{ color: TEAL }}
                >
                  {pdfLoading
                    ? <span className="w-4 h-4 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
                    : 'Download PDF'
                  }
                </button>
              </Reveal>

              {/* Find Installer */}
              <Reveal delay={0.08} className="rounded-2xl p-6 bg-white border border-gray-100 shadow-sm flex flex-col gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                     style={{ background: SURF }}>
                  <ExternalLink size={22} style={{ color: TEAL }} />
                </div>
                <div>
                  <p className="font-bold text-base mb-1" style={{ color: DARK }}>Find an Installer</p>
                  <p className="text-sm text-gray-500">
                    Browse SEDA's RPVSP list of registered solar contractors in Malaysia.
                  </p>
                </div>
                <a
                  href="https://www.seda.gov.my/directory/registered-pv-service-provider-directory/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                  style={{ background: DARK }}
                >
                  SEDA RPVSP List <ExternalLink size={13} />
                </a>
              </Reveal>

              {/* Share Results */}
              <Reveal delay={0.16} className="rounded-2xl p-6 bg-white border border-gray-100 shadow-sm flex flex-col gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                     style={{ background: SURF }}>
                  <Share2 size={22} style={{ color: TEAL }} />
                </div>
                <div>
                  <p className="font-bold text-base mb-1" style={{ color: DARK }}>Share Results</p>
                  <p className="text-sm text-gray-500">
                    Generate a Instagram or WhatsApp card, or copy the link.
                  </p>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-2">
                  <ShareCardComponent
                    result={r}
                    inputs={inputs}
                    triggerClassName="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                    triggerLabel="Share Image"
                    triggerStyle={{ background: TEAL }}
                  />
                  <button
                    onClick={copyLink}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-all active:scale-95"
                  >
                    <Copy size={13}/> Link
                  </button>
                </div>
              </Reveal>
            </div>

            {/* disclaimer */}
            <Reveal delay={0.2}>
              <p className="mt-6 text-xs text-center text-gray-400 leading-relaxed max-w-2xl mx-auto">
                {t('disclaimer')}
              </p>
            </Reveal>
          </section>
        </div>
      </div>

      {/* toast */}
      <AnimatePresence>
        {toast && <Toast key={toast} msg={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </>
  )
}
