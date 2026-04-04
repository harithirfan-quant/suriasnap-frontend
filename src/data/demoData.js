// ─── Mirror of app/services/solar_calc.py ────────────────────────────────────
// Results are computed at module load so the demo works fully offline.

const GHI = {
  'Perlis': 5.15, 'Kedah': 5.05, 'Penang': 4.95, 'Perak': 4.85,
  'Selangor': 4.70, 'Kuala Lumpur': 4.65, 'Negeri Sembilan': 4.80,
  'Melaka': 4.90, 'Johor': 4.70, 'Pahang': 4.80, 'Terengganu': 4.90,
  'Kelantan': 4.80, 'Sabah': 5.05, 'Sarawak': 4.65, 'Labuan': 4.95,
  'Putrajaya': 4.70,
}

const ORIENTATION_FACTOR = { South: 1.00, North: 0.95, East: 0.90, West: 0.90 }

const PANEL_EFFICIENCY   = 0.21
const AREA_UTILIZATION   = 0.70
const PERFORMANCE_RATIO  = 0.80
const COST_PER_KWP       = 4000
const EMISSION_FACTOR    = 0.585   // kgCO2/kWh
const DEGRADATION        = 0.005   // 0.5%/year
const PANEL_W            = 400
const DAYS               = 30
const YEARS              = 25

const EXPORT_RATE        = 0.2703  // RM/kWh (Solar ATAP NEM)

function tnbBill(kwh) {
  const energy  = kwh <= 1500
    ? kwh * 0.2703
    : 1500 * 0.2703 + (kwh - 1500) * 0.3703
  const capacity = kwh * 0.0455
  const network  = kwh * 0.1285
  const retail   = kwh < 600 ? 0 : 10
  return energy + capacity + network + retail
}

function r2(n) { return Math.round(n * 100) / 100 }
function r1(n) { return Math.round(n * 10)  / 10  }

function calcResult(state, monthly_consumption_kwh, roof_area_sqm, roof_orientation) {
  const ghi    = GHI[state]
  const oFact  = ORIENTATION_FACTOR[roof_orientation]

  // Sizing
  const panelArea   = PANEL_W / (1000 * PANEL_EFFICIENCY)    // ~1.905 m²
  const numPanels   = Math.floor(roof_area_sqm * AREA_UTILIZATION / panelArea)
  const systemKwp   = numPanels * PANEL_W / 1000

  // Generation
  const monthlyGen  = systemKwp * ghi * oFact * PERFORMANCE_RATIO * DAYS

  // Savings
  const oldBill     = tnbBill(monthly_consumption_kwh)
  const netConsump  = Math.max(0, monthly_consumption_kwh - monthlyGen)
  const newBill     = tnbBill(netConsump)
  const exportKwh   = Math.max(0, monthlyGen - monthly_consumption_kwh)
  const monthlySav  = (oldBill - newBill) + exportKwh * EXPORT_RATE

  // CO2
  const annualCo2   = monthlyGen * 12 * EMISSION_FACTOR

  // Financials
  const systemCost  = systemKwp * COST_PER_KWP
  const annualSav   = monthlySav * 12
  const payback     = annualSav > 0 ? systemCost / annualSav : Infinity

  let total25 = 0
  for (let y = 0; y < YEARS; y++) total25 += annualSav * Math.pow(1 - DEGRADATION, y)
  const roi25 = total25 - systemCost

  return {
    recommended_system_kwp: r2(systemKwp),
    num_panels_400w:         numPanels,
    monthly_generation_kwh:  r2(monthlyGen),
    monthly_savings_rm:      r2(monthlySav),
    annual_co2_offset_kg:    r2(annualCo2),
    system_cost_rm:          r2(systemCost),
    payback_years:           r1(payback),
    roi_25_year_rm:          r2(roi25),
  }
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

const SCENARIOS_RAW = [
  {
    id:    'kl-typical',
    label: 'Typical KL Home',
    emoji: '🏠',
    tag:   'Most common',
    desc:  'A typical Selangor terrace home with moderate electricity usage.',
    inputs: {
      state:                   'Selangor',
      monthly_consumption_kwh: 500,
      roof_area_sqm:           80,
      roof_orientation:        'South',
    },
  },
  {
    id:    'penang-bungalow',
    label: 'Large Penang Bungalow',
    emoji: '🏡',
    tag:   'High savings',
    desc:  'A large Penang bungalow with high consumption and a big roof.',
    inputs: {
      state:                   'Penang',
      monthly_consumption_kwh: 1200,
      roof_area_sqm:           150,
      roof_orientation:        'South',
    },
  },
  {
    id:    'sabah-eco',
    label: 'Sabah Eco-Home',
    emoji: '🌿',
    tag:   'Eco focus',
    desc:  'A modest Sabah home optimised for low carbon footprint.',
    inputs: {
      state:                   'Sabah',
      monthly_consumption_kwh: 350,
      roof_area_sqm:           60,
      roof_orientation:        'West',
    },
  },
]

// Attach pre-calculated results to each scenario
const DEMO_SCENARIOS = SCENARIOS_RAW.map(s => ({
  ...s,
  result: calcResult(
    s.inputs.state,
    s.inputs.monthly_consumption_kwh,
    s.inputs.roof_area_sqm,
    s.inputs.roof_orientation,
  ),
}))

export default DEMO_SCENARIOS
