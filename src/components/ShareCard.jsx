/**
 * ShareCard.jsx
 *
 * Self-contained share-card component.
 *
 * Usage:
 *   <ShareCard result={r} inputs={inputs} />
 *
 * Renders a trigger button. On click, opens a modal where the user
 * can switch between Instagram (1080×1080) and WhatsApp (1200×630)
 * formats, preview the card at reduced scale, then share or download.
 *
 * Sharing:
 *   – Mobile/PWA: Web Share API (navigator.share)
 *   – Desktop:    PNG download fallback
 */

import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'
import { Share2, Download, X, ImageIcon, MessageCircle, Check, Loader } from 'lucide-react'

// ─── design tokens (must match ResultPage) ────────────────────────────────────
const TEAL   = '#0D7377'
const TEAL_L = '#14BDBD'
const DARK   = '#16213E'

// ─── format definitions ───────────────────────────────────────────────────────
const FORMATS = {
  instagram: {
    id:       'instagram',
    label:    'Instagram',
    icon:     ImageIcon,
    // off-screen render size (html2canvas scale:2 → 1080×1080 output)
    width:    540,
    height:   540,
    // preview scale inside the modal
    preview:  0.48,
    filename: 'suriasnap-instagram.png',
    hint:     '1080 × 1080 px · Square post',
  },
  whatsapp: {
    id:       'whatsapp',
    label:    'WhatsApp / Twitter',
    icon:     MessageCircle,
    width:    600,
    height:   315,
    preview:  0.60,
    filename: 'suriasnap-share.png',
    hint:     '1200 × 630 px · Landscape',
  },
}

// ─── helper: capture a ref → Blob ────────────────────────────────────────────
async function captureRef(ref, format) {
  const canvas = await html2canvas(ref.current, {
    scale:           2,
    useCORS:         true,
    backgroundColor: null,
    width:           format.width,
    height:          format.height,
    windowWidth:     format.width,
    windowHeight:    format.height,
  })
  return new Promise((res, rej) =>
    canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob failed')), 'image/png'),
  )
}

// ─── off-screen Instagram card (540×540 → 1080×1080) ─────────────────────────
function InstagramCard({ result: r, inputs, annualSavings, co2Tonnes, trees, ref: cardRef }) {
  const fmt = FORMATS.instagram
  return (
    <div ref={cardRef} style={{
      position: 'fixed', top: '-9999px', left: '-9999px',
      width: fmt.width, height: fmt.height,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
      background: `linear-gradient(145deg, ${DARK} 0%, #0f3460 55%, ${TEAL} 100%)`,
    }}>
      {/* decorative circles */}
      <div style={{ position:'absolute', top:'-80px', right:'-80px', width:'260px', height:'260px',
                    borderRadius:'50%', background: TEAL, opacity:0.18 }} />
      <div style={{ position:'absolute', bottom:'-60px', left:'-60px', width:'180px', height:'180px',
                    borderRadius:'50%', background: TEAL_L, opacity:0.10 }} />
      {/* sunburst lines */}
      {[0,30,60,90,120,150].map(deg => (
        <div key={deg} style={{
          position:'absolute', top:'50%', left:'50%',
          width:'400px', height:'1px',
          background: 'rgba(255,255,255,0.03)',
          transformOrigin:'0 50%',
          transform:`rotate(${deg}deg)`,
        }} />
      ))}

      <div style={{ position:'relative', padding:'36px', height:'100%', boxSizing:'border-box',
                    display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        {/* logo row */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:TEAL,
                        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ fontSize:'18px' }}>☀</span>
          </div>
          <span style={{ color:'#fff', fontWeight:800, fontSize:'18px', letterSpacing:'-0.3px' }}>
            Suria<span style={{ color:TEAL_L }}>Snap</span>
          </span>
          <span style={{ marginLeft:'auto', fontSize:'10px', fontWeight:600, letterSpacing:'2px',
                          color: TEAL_L, textTransform:'uppercase', opacity:0.8 }}>
            Solar Assessment
          </span>
        </div>

        {/* hero headline */}
        <div>
          <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'13px', fontWeight:600,
                      letterSpacing:'1.5px', textTransform:'uppercase', margin:'0 0 10px' }}>
            My home in {inputs.state} could save
          </p>
          <p style={{ color:'#fff', fontSize:'62px', fontWeight:900, lineHeight:1,
                      margin:'0 0 8px', letterSpacing:'-2px' }}>
            RM {annualSavings.toLocaleString()}
          </p>
          <p style={{ color: TEAL_L, fontSize:'20px', fontWeight:600, margin:0 }}>
            per year with solar
          </p>
        </div>

        {/* stat chips */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
          {[
            ['⚡ System Size', `${r.recommended_system_kwp} kWp`],
            ['🌱 CO₂ Offset',  `${co2Tonnes} t / yr`],
            ['📅 Payback',     `${r.payback_years} years`],
            ['💰 25-Yr ROI',   `RM ${Math.round(r.roi_25_year_rm/1000)}k`],
          ].map(([label, value]) => (
            <div key={label} style={{
              background:'rgba(255,255,255,0.07)', backdropFilter:'blur(4px)',
              borderRadius:'12px', padding:'12px 14px',
              border:'1px solid rgba(255,255,255,0.08)',
            }}>
              <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'10px',
                          fontWeight:600, margin:'0 0 4px' }}>{label}</p>
              <p style={{ color:'#fff', fontSize:'18px', fontWeight:700, margin:0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* footer */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <p style={{ color:'rgba(255,255,255,0.25)', fontSize:'11px', margin:0 }}>
            suriasnap.my
          </p>
          <p style={{ color:'rgba(255,255,255,0.2)', fontSize:'10px', margin:0 }}>
            Data: Global Solar Atlas · SEDA Malaysia
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── off-screen WhatsApp / Twitter card (600×315 → 1200×630) ─────────────────
function WhatsAppCard({ result: r, inputs, annualSavings, co2Tonnes, ref: cardRef }) {
  const fmt = FORMATS.whatsapp
  return (
    <div ref={cardRef} style={{
      position:'fixed', top:'-9999px', left:'-9999px',
      width:fmt.width, height:fmt.height,
      fontFamily:'system-ui, -apple-system, sans-serif',
      overflow:'hidden',
      background:`linear-gradient(120deg, ${DARK} 0%, #0f3460 60%, ${TEAL} 100%)`,
    }}>
      {/* decorative blob */}
      <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'200px', height:'200px',
                    borderRadius:'50%', background:TEAL, opacity:0.15 }} />
      <div style={{ position:'absolute', bottom:'-30px', left:'300px', width:'120px', height:'120px',
                    borderRadius:'50%', background:TEAL_L, opacity:0.08 }} />

      <div style={{ position:'relative', padding:'32px', height:'100%', boxSizing:'border-box',
                    display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:'24px', alignItems:'center' }}>
        {/* left: headline */}
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
            <div style={{ width:'26px', height:'26px', borderRadius:'7px', background:TEAL,
                          display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:'14px' }}>☀</span>
            </div>
            <span style={{ color:'#fff', fontWeight:800, fontSize:'14px' }}>
              Suria<span style={{ color:TEAL_L }}>Snap</span>
            </span>
          </div>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'11px', fontWeight:600,
                      letterSpacing:'1.5px', textTransform:'uppercase', margin:0 }}>
            {inputs.state} · Solar Assessment
          </p>
          <p style={{ color:'#fff', fontSize:'42px', fontWeight:900, lineHeight:1,
                      margin:'4px 0 0', letterSpacing:'-1.5px' }}>
            RM {annualSavings.toLocaleString()}
          </p>
          <p style={{ color:TEAL_L, fontSize:'15px', fontWeight:600, margin:0 }}>
            saved per year with solar
          </p>
          <p style={{ color:'rgba(255,255,255,0.2)', fontSize:'10px', margin:'8px 0 0' }}>
            suriasnap.my · Global Solar Atlas & SEDA Malaysia
          </p>
        </div>

        {/* right: stats */}
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {[
            ['⚡ System', `${r.recommended_system_kwp} kWp`],
            ['🌱 CO₂',    `${co2Tonnes} t/yr`],
            ['📅 Payback', `${r.payback_years} yrs`],
            ['💰 25yr ROI',`RM ${Math.round(r.roi_25_year_rm/1000)}k`],
          ].map(([label, value]) => (
            <div key={label} style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              background:'rgba(255,255,255,0.07)', borderRadius:'10px',
              padding:'10px 14px', border:'1px solid rgba(255,255,255,0.07)',
            }}>
              <span style={{ color:'rgba(255,255,255,0.45)', fontSize:'11px', fontWeight:600 }}>
                {label}
              </span>
              <span style={{ color:'#fff', fontSize:'15px', fontWeight:700 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── modal ────────────────────────────────────────────────────────────────────
function ShareModal({ result: r, inputs, onClose, igRef, waRef }) {
  const [format,    setFormat]    = useState('instagram')
  const [status,    setStatus]    = useState('idle')  // idle|loading|done|error
  const [errorMsg,  setErrorMsg]  = useState('')

  const annualSavings = Math.round(r.monthly_savings_rm * 12)
  const co2Tonnes     = (r.annual_co2_offset_kg / 1000).toFixed(2)
  const activeRef     = format === 'instagram' ? igRef : waRef
  const fmt           = FORMATS[format]

  const handleShare = useCallback(async () => {
    setStatus('loading')
    setErrorMsg('')
    try {
      const blob = await captureRef(activeRef, fmt)
      const file = new File([blob], fmt.filename, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files:  [file],
          title:  `My home in ${inputs.state} could save RM ${annualSavings.toLocaleString()}/yr with solar!`,
          text:   `Check out my SuriaSnap solar assessment — saving RM ${annualSavings.toLocaleString()} a year with a ${r.recommended_system_kwp} kWp system.`,
        })
      } else {
        // desktop fallback: download
        const url = URL.createObjectURL(blob)
        Object.assign(document.createElement('a'), { href:url, download:fmt.filename }).click()
        URL.revokeObjectURL(url)
      }
      setStatus('done')
      setTimeout(() => setStatus('idle'), 2200)
    } catch (e) {
      if (e?.name !== 'AbortError') {
        setErrorMsg('Could not share. Try the download option instead.')
        setStatus('error')
        setTimeout(() => setStatus('idle'), 3000)
      } else {
        setStatus('idle')
      }
    }
  }, [activeRef, fmt, inputs, annualSavings, r])

  const handleDownload = useCallback(async () => {
    setStatus('loading')
    try {
      const blob = await captureRef(activeRef, fmt)
      const url  = URL.createObjectURL(blob)
      Object.assign(document.createElement('a'), { href:url, download:fmt.filename }).click()
      URL.revokeObjectURL(url)
      setStatus('done')
      setTimeout(() => setStatus('idle'), 2200)
    } catch {
      setErrorMsg('Could not generate image.')
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }, [activeRef, fmt])

  return (
    <motion.div
      initial={{ opacity:0 }}
      animate={{ opacity:1 }}
      exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background:'rgba(22,33,62,0.75)', backdropFilter:'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity:0, y:40, scale:0.97 }}
        animate={{ opacity:1, y:0,  scale:1   }}
        exit={{    opacity:0, y:40, scale:0.97 }}
        transition={{ type:'spring', stiffness:320, damping:28 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background:'#E0F7F7' }}>
              <Share2 size={18} style={{ color:TEAL }} />
            </div>
            <div>
              <p className="font-bold text-base" style={{ color:DARK }}>Share your results</p>
              <p className="text-xs text-gray-400">Choose a format to share or download</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* format toggle */}
        <div className="px-6 pt-5 pb-4">
          <div className="flex gap-2 p-1 rounded-xl bg-gray-100">
            {Object.values(FORMATS).map(f => {
              const Icon = f.icon
              return (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: format === f.id ? '#fff'    : 'transparent',
                    color:      format === f.id ? TEAL      : '#6B7280',
                    boxShadow:  format === f.id ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                  }}
                >
                  <Icon size={14} />
                  {f.label}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-center text-gray-400 mt-2">{fmt.hint}</p>
        </div>

        {/* scaled preview */}
        <div className="flex justify-center px-6 pb-5">
          <div
            className="relative overflow-hidden rounded-2xl shadow-lg border border-gray-100"
            style={{
              width:  fmt.width  * fmt.preview,
              height: fmt.height * fmt.preview,
            }}
          >
            {/* iframe-style scale trick: transform the live off-screen card into visible view */}
            <LivePreview format={fmt} result={r} inputs={inputs}
                         annualSavings={annualSavings} co2Tonnes={co2Tonnes} />
          </div>
        </div>

        {/* error */}
        <AnimatePresence>
          {status === 'error' && (
            <motion.p
              initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="text-xs text-center text-red-500 px-6 pb-3"
            >
              {errorMsg}
            </motion.p>
          )}
        </AnimatePresence>

        {/* action buttons */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={handleDownload}
            disabled={status === 'loading'}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
          >
            {status === 'loading'
              ? <Loader size={15} className="animate-spin" />
              : status === 'done'
              ? <Check size={15} />
              : <Download size={15} />
            }
            Download PNG
          </button>

          <button
            onClick={handleShare}
            disabled={status === 'loading'}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50 hover:opacity-90"
            style={{ background: status === 'done' ? '#059669' : TEAL }}
          >
            {status === 'loading'
              ? <Loader size={15} className="animate-spin" />
              : status === 'done'
              ? <><Check size={15} /> Shared!</>
              : <><Share2 size={15} /> Share</>
            }
          </button>
        </div>

        <p className="text-xs text-center text-gray-300 pb-5">
          On mobile, tapping Share opens the system share sheet
        </p>
      </motion.div>
    </motion.div>
  )
}

// ─── inline preview (CSS scaled clone of the off-screen card) ────────────────
function LivePreview({ format: fmt, result: r, inputs, annualSavings, co2Tonnes }) {
  // We render a duplicate of the card inside the preview box, scaled down with CSS transform
  // This is purely visual — html2canvas captures the off-screen originals at full resolution
  const scale = fmt.preview

  const inner = fmt.id === 'instagram' ? (
    <div style={{
      width:fmt.width, height:fmt.height, transformOrigin:'top left',
      transform:`scale(${scale})`,
      background:`linear-gradient(145deg, ${DARK} 0%, #0f3460 55%, ${TEAL} 100%)`,
      overflow:'hidden', position:'relative', flexShrink:0,
    }}>
      <div style={{ position:'absolute', top:'-80px', right:'-80px', width:'260px', height:'260px',
                    borderRadius:'50%', background:TEAL, opacity:0.18 }} />
      <div style={{ position:'relative', padding:'36px', height:'100%', boxSizing:'border-box',
                    display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:TEAL,
                        display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:'18px' }}>☀</span>
          </div>
          <span style={{ color:'#fff', fontWeight:800, fontSize:'18px' }}>
            Suria<span style={{ color:TEAL_L }}>Snap</span>
          </span>
        </div>
        <div>
          <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'13px', fontWeight:600,
                      letterSpacing:'1.5px', textTransform:'uppercase', margin:'0 0 10px' }}>
            My home in {inputs.state} could save
          </p>
          <p style={{ color:'#fff', fontSize:'62px', fontWeight:900, lineHeight:1,
                      margin:'0 0 8px', letterSpacing:'-2px' }}>
            RM {annualSavings.toLocaleString()}
          </p>
          <p style={{ color:TEAL_L, fontSize:'20px', fontWeight:600, margin:0 }}>per year with solar</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
          {[
            ['⚡ System Size', `${r.recommended_system_kwp} kWp`],
            ['🌱 CO₂ Offset',  `${co2Tonnes} t / yr`],
            ['📅 Payback',     `${r.payback_years} years`],
            ['💰 25-Yr ROI',   `RM ${Math.round(r.roi_25_year_rm/1000)}k`],
          ].map(([label, value]) => (
            <div key={label} style={{ background:'rgba(255,255,255,0.07)', borderRadius:'12px',
                                      padding:'12px 14px', border:'1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'10px', fontWeight:600, margin:'0 0 4px' }}>{label}</p>
              <p style={{ color:'#fff', fontSize:'18px', fontWeight:700, margin:0 }}>{value}</p>
            </div>
          ))}
        </div>
        <p style={{ color:'rgba(255,255,255,0.2)', fontSize:'11px', margin:0 }}>suriasnap.my</p>
      </div>
    </div>
  ) : (
    <div style={{
      width:fmt.width, height:fmt.height, transformOrigin:'top left',
      transform:`scale(${scale})`,
      background:`linear-gradient(120deg, ${DARK} 0%, #0f3460 60%, ${TEAL} 100%)`,
      overflow:'hidden', position:'relative', flexShrink:0,
    }}>
      <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'200px', height:'200px',
                    borderRadius:'50%', background:TEAL, opacity:0.15 }} />
      <div style={{ position:'relative', padding:'32px', height:'100%', boxSizing:'border-box',
                    display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:'24px', alignItems:'center' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ width:'26px', height:'26px', borderRadius:'7px', background:TEAL,
                          display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:'14px' }}>☀</span>
            </div>
            <span style={{ color:'#fff', fontWeight:800, fontSize:'14px' }}>
              Suria<span style={{ color:TEAL_L }}>Snap</span>
            </span>
          </div>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'11px', fontWeight:600,
                      letterSpacing:'1.5px', textTransform:'uppercase', margin:0 }}>
            {inputs.state} · Solar Assessment
          </p>
          <p style={{ color:'#fff', fontSize:'42px', fontWeight:900, lineHeight:1,
                      margin:'4px 0 0', letterSpacing:'-1.5px' }}>
            RM {annualSavings.toLocaleString()}
          </p>
          <p style={{ color:TEAL_L, fontSize:'15px', fontWeight:600, margin:0 }}>saved per year with solar</p>
          <p style={{ color:'rgba(255,255,255,0.2)', fontSize:'10px', margin:'4px 0 0' }}>suriasnap.my</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {[
            ['⚡ System', `${r.recommended_system_kwp} kWp`],
            ['🌱 CO₂',    `${co2Tonnes} t/yr`],
            ['📅 Payback', `${r.payback_years} yrs`],
            ['💰 25yr ROI',`RM ${Math.round(r.roi_25_year_rm/1000)}k`],
          ].map(([label, value]) => (
            <div key={label} style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              background:'rgba(255,255,255,0.07)', borderRadius:'10px',
              padding:'8px 12px', border:'1px solid rgba(255,255,255,0.07)',
            }}>
              <span style={{ color:'rgba(255,255,255,0.45)', fontSize:'10px', fontWeight:600 }}>{label}</span>
              <span style={{ color:'#fff', fontSize:'13px', fontWeight:700 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ width:fmt.width*scale, height:fmt.height*scale, overflow:'hidden', display:'flex' }}>
      {inner}
    </div>
  )
}

// ─── public component ─────────────────────────────────────────────────────────
export default function ShareCard({ result, inputs, triggerClassName, triggerLabel, triggerStyle }) {
  const [open,   setOpen]   = useState(false)
  const igRef               = useRef(null)
  const waRef               = useRef(null)

  const annualSavings = Math.round(result.monthly_savings_rm * 12)
  const co2Tonnes     = (result.annual_co2_offset_kg / 1000).toFixed(2)
  const trees         = Math.floor(result.annual_co2_offset_kg / 22)

  return (
    <>
      {/* off-screen capture targets */}
      <InstagramCard ref={igRef} result={result} inputs={inputs}
                     annualSavings={annualSavings} co2Tonnes={co2Tonnes} trees={trees} />
      <WhatsAppCard  ref={waRef} result={result} inputs={inputs}
                     annualSavings={annualSavings} co2Tonnes={co2Tonnes} />

      {/* trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={triggerClassName ?? 'flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all'}
        style={triggerStyle}
      >
        <Share2 size={13} />
        {triggerLabel ?? 'Share'}
      </button>

      {/* modal */}
      <AnimatePresence>
        {open && (
          <ShareModal
            result={result}
            inputs={inputs}
            igRef={igRef}
            waRef={waRef}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
