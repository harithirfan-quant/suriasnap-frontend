import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useRef } from 'react'
import {
  Zap, DollarSign, Calendar, TrendingUp,
  Leaf, Download, RefreshCw, Info,
} from 'lucide-react'
import PageTransition from '../components/PageTransition'
import axios from 'axios'

const TEAL = '#0D7377'

function KpiCard({ icon: Icon, label, value, sub, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#E0F7F7' }}>
          <Icon size={16} style={{ color: TEAL }} />
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ color: '#16213E' }}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </motion.div>
  )
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? '' : 'text-gray-800'}`}
            style={highlight ? { color: TEAL } : {}}>
        {value}
      </span>
    </div>
  )
}

export default function Result() {
  const { state } = useLocation()
  const navigate   = useNavigate()
  const dlRef      = useRef()

  if (!state?.result) {
    return (
      <PageTransition>
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <p className="text-gray-500 mb-4">No assessment data found.</p>
          <button onClick={() => navigate('/assess')}
            className="px-5 py-2.5 rounded-xl text-white font-medium"
            style={{ background: TEAL }}>
            Start Assessment
          </button>
        </div>
      </PageTransition>
    )
  }

  const { result: r, inputs } = state
  const trees = Math.floor(r.annual_co2_offset_kg / 22)

  async function downloadPdf() {
    try {
      const resp = await axios.post('/api/report', {
        state:                   inputs.state,
        monthly_consumption_kwh: +inputs.monthly_consumption_kwh,
        roof_area_sqm:           +inputs.roof_area_sqm,
        roof_orientation:        inputs.roof_orientation,
      }, { responseType: 'blob' })

      const url = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }))
      const a   = document.createElement('a')
      a.href     = url
      a.download = 'suriasnap-report.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Could not generate PDF. Please ensure the backend is running.')
    }
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* Top bar */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#16213E' }}>Your Solar Assessment</h1>
            <p className="text-sm text-gray-500 mt-1">
              {inputs.state} · {inputs.roof_area_sqm} m² roof · {inputs.roof_orientation}-facing
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/assess')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-colors"
            >
              <RefreshCw size={14} /> Recalculate
            </button>
            <button
              onClick={downloadPdf}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
              style={{ background: TEAL }}
            >
              <Download size={14} /> Download PDF
            </button>
          </div>
        </div>

        {/* System banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
          style={{ background: '#16213E' }}
        >
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#14BDBD' }}>
              Recommended System
            </p>
            <p className="text-4xl font-bold text-white">{r.recommended_system_kwp} kWp</p>
            <p className="text-gray-400 text-sm mt-1">
              {r.num_panels_400w} × 400W panels · {r.monthly_generation_kwh.toLocaleString()} kWh/month generated
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1">
            <span className="text-xs text-gray-500">System cost estimate</span>
            <span className="text-2xl font-semibold text-white">
              RM {r.system_cost_rm.toLocaleString()}
            </span>
            <span className="text-xs" style={{ color: '#14BDBD' }}>Based on RM 4,000/kWp installed</span>
          </div>
        </motion.div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard icon={DollarSign} label="Monthly Savings"
            value={`RM ${r.monthly_savings_rm.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}
            sub="Avg. based on TNB tariff" delay={0.05} />
          <KpiCard icon={TrendingUp} label="Annual Savings"
            value={`RM ${(r.monthly_savings_rm * 12).toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            sub="Before degradation" delay={0.1} />
          <KpiCard icon={Calendar} label="Payback Period"
            value={`${r.payback_years} yrs`}
            sub="Simple payback" delay={0.15} />
          <KpiCard icon={TrendingUp} label="25-Year ROI"
            value={`RM ${(r.roi_25_year_rm / 1000).toFixed(0)}k`}
            sub="Net after system cost" delay={0.2} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Financial detail */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
          >
            <h2 className="text-base font-semibold mb-1" style={{ color: '#16213E' }}>Financial Breakdown</h2>
            <p className="text-xs text-gray-400 mb-4">Calculated using current TNB tariff rates</p>
            <Row label="Monthly Consumption"       value={`${inputs.monthly_consumption_kwh} kWh`} />
            <Row label="Monthly Generation"        value={`${r.monthly_generation_kwh} kWh`} />
            <Row label="Monthly Savings"           value={`RM ${r.monthly_savings_rm.toFixed(2)}`} highlight />
            <Row label="Annual Savings"            value={`RM ${(r.monthly_savings_rm * 12).toFixed(0)}`} highlight />
            <Row label="System Cost"               value={`RM ${r.system_cost_rm.toLocaleString()}`} />
            <Row label="Payback Period"            value={`${r.payback_years} years`} />
            <Row label="25-Year Net ROI"           value={`RM ${r.roi_25_year_rm.toLocaleString()}`} highlight />
          </motion.div>

          {/* Environmental + NEM */}
          <div className="flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl p-5 flex-1"
              style={{ background: '#E0F7F7', border: `1px solid ${TEAL}22` }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Leaf size={18} style={{ color: TEAL }} />
                <h2 className="text-base font-semibold" style={{ color: '#16213E' }}>Environmental Impact</h2>
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-4">
                  <p className="text-xs text-gray-400">Annual CO₂ Offset</p>
                  <p className="text-xl font-bold mt-0.5" style={{ color: TEAL }}>
                    {r.annual_co2_offset_kg.toLocaleString()} kg
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <p className="text-xs text-gray-400">Equivalent to planting</p>
                  <p className="text-xl font-bold mt-0.5" style={{ color: TEAL }}>
                    {trees.toLocaleString()} trees / year
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <Info size={16} style={{ color: TEAL }} />
                <h2 className="text-base font-semibold" style={{ color: '#16213E' }}>Solar ATAP (NEM)</h2>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Under SEDA's Net Energy Metering scheme, surplus generation is exported to TNB at{' '}
                <strong>RM 0.2703/kWh</strong>. Savings shown include this export credit.
              </p>
            </motion.div>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
          className="mt-6 rounded-2xl p-6 text-center"
          style={{ background: '#16213E' }}
        >
          <p className="text-white font-semibold text-lg mb-1">Ready to go solar?</p>
          <p className="text-gray-400 text-sm mb-4">
            Connect with a SEDA-registered installer for a site survey and final quotation.
          </p>
          <a
            href="https://www.seda.gov.my"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
            style={{ background: TEAL }}
          >
            Find a SEDA Installer
          </a>
        </motion.div>

        <a ref={dlRef} className="hidden" />
      </div>
    </PageTransition>
  )
}
