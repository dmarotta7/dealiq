import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { runEvaluation, pullLocationData } from '../lib/anthropic'
import { carwashDefaults } from '../components/evaluator/CarwashForm'
import { apartmentDefaults } from '../components/evaluator/ApartmentForm'
import { laundryDefaults } from '../components/evaluator/LaundryForm'
import { storageDefaults } from '../components/evaluator/StorageForm'
import { Search, MapPin, Sparkles, AlertCircle, ExternalLink, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const BUSINESS_TYPES = [
  { id: 'carwash',    label: 'Car Wash',     sources: 'CarWashKing, BizBuySell' },
  { id: 'laundromat', label: 'Laundromat',   sources: 'BizBuySell, BizQuest' },
  { id: 'storage',    label: 'Self-Storage', sources: 'LoopNet, BizBuySell' },
  { id: 'apartment',  label: 'Multifamily',  sources: 'LoopNet, Crexi, Marcus & Millichap' },
]

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming'
]

const DEFAULTS = {
  carwash: carwashDefaults,
  apartment: apartmentDefaults,
  laundromat: laundryDefaults,
  storage: storageDefaults,
}

// Build evaluation inputs from disclosed listing financials
// Key principle: use 60-65% expense ratios and NO owner_sal add-back
// The AI's cash_flow is already the seller's discretionary earnings
function buildInputs(businessType, listing) {
  const defaults = DEFAULTS[businessType]
  const price = listing.asking_price || defaults.price
  const annual_revenue = listing.annual_revenue || 0

  if (businessType === 'carwash') {
    if (annual_revenue > 0) {
      // Industry reality: expenses = 60-65% of revenue
      const total_exp = Math.round(annual_revenue * 0.62)
      const mem_revenue = Math.round(annual_revenue * 0.50)
      const retail_revenue = Math.round(annual_revenue * 0.45)
      const members = Math.round(mem_revenue / 12 / 32)
      const retail_cars = Math.round(retail_revenue / 12 / 13)
      return {
        ...defaults,
        members,
        mem_price: 32,
        retail_cars,
        retail_price: 13,
        other_rev: Math.round(annual_revenue * 0.05 / 12),
        labor: Math.round(total_exp * 0.40),
        chem: Math.round(total_exp * 0.15),
        util: Math.round(total_exp * 0.18),
        rent: Math.round(total_exp * 0.15),
        maint: Math.round(total_exp * 0.07),
        mktg: Math.round(total_exp * 0.03),
        insur: Math.round(total_exp * 0.02),
        overhead: 0,
        // No owner_sal — cash_flow from listing already reflects real earnings
        owner_sal: 0, personal: 0, onetime: 0,
        price,
        equip_res: Math.round(price * 0.01),
        dp_pct: 20, rate: 7.5, term: 10,
      }
    }
    return { ...defaults, price, owner_sal: 0, personal: 0, onetime: 0 }
  }

  if (businessType === 'laundromat') {
    if (annual_revenue > 0) {
      // Laundromat: expenses 58-65% of revenue (utilities are massive)
      const total_exp = Math.round(annual_revenue * 0.62)
      const weekly_rev = Math.round(annual_revenue / 52)
      return {
        ...defaults,
        weekly_rev,
        vending: Math.round(weekly_rev * 0.04),
        washers: defaults.washers,
        dryers: defaults.dryers,
        equip_age: defaults.equip_age,
        utilities: Math.round(total_exp * 0.42),
        rent: Math.round(total_exp * 0.28),
        labor: Math.round(total_exp * 0.16),
        supplies: Math.round(total_exp * 0.08),
        maint: Math.round(total_exp * 0.04),
        insur: Math.round(total_exp * 0.01),
        overhead: Math.round(total_exp * 0.01),
        owner_sal: 0, personal: 0, onetime: 0,
        price,
        equip_res: Math.round(price * 0.04),
        dp_pct: 20, rate: 7.5, term: 10,
      }
    }
    return { ...defaults, price, owner_sal: 0, personal: 0, onetime: 0 }
  }

  if (businessType === 'storage') {
    // For storage, work backwards from NOI (cap rate) not gross revenue
    // Use cash_flow as NOI if available, otherwise derive from annual_revenue
    const target_noi = listing.cash_flow > 0 ? listing.cash_flow : Math.round(price * 0.075)
    const target_gross = Math.round(target_noi / 0.60) // NOI = 60% of gross revenue
    const units = defaults.total_units
    const occupancy = listing.occupancy || 87
    const avg_rent = Math.round(target_gross / 12 / (units * occupancy / 100))
    const total_exp = target_gross - target_noi
    return {
      ...defaults,
      total_units: units,
      occupancy,
      avg_rent: Math.max(avg_rent, 65),
      climate_rent: Math.round(Math.max(avg_rent, 65) * 1.35),
      other_income: Math.round(target_gross * 0.03 / 12),
      taxes: Math.round(total_exp * 0.28),
      insurance: Math.round(total_exp * 0.18),
      management: Math.round(total_exp * 0.28),
      utilities: Math.round(total_exp * 0.14),
      maintenance: Math.round(total_exp * 0.08),
      marketing: Math.round(total_exp * 0.04),
      other_opex: 0,
      price,
      capex: Math.round(price * 0.005),
      dp_pct: 25, rate: 6.75, term: 25,
    }
  }

  if (businessType === 'apartment') {
    if (annual_revenue > 0) {
      // Apartment: expenses 45-50% of EGI
      const gpr = annual_revenue
      const vacancy = Math.round(gpr * 0.07)
      const other_income = Math.round(gpr * 0.03)
      const egi = gpr - vacancy + other_income
      const total_exp = Math.round(egi * 0.47)
      return {
        ...defaults,
        gpr,
        vacancy,
        concessions: 0,
        bad_debt: Math.round(gpr * 0.005),
        other_income,
        taxes: Math.round(total_exp * 0.22),
        insurance: Math.round(total_exp * 0.12),
        management: Math.round(total_exp * 0.18),
        payroll: Math.round(total_exp * 0.10),
        maintenance: Math.round(total_exp * 0.20),
        utilities: Math.round(total_exp * 0.12),
        other_opex: Math.round(total_exp * 0.06),
        price,
        dp_pct: 25, rate: 6.75, term: 30,
      }
    }
    return { ...defaults, price }
  }

  return { ...defaults, price }
}

async function searchListings(state, businessType) {
  const typeLabels = {
    carwash: 'car wash',
    laundromat: 'coin-operated laundromat',
    storage: 'self-storage facility',
    apartment: 'multifamily apartment building'
  }

  const sources = {
    carwash: 'CarWashKing.com and BizBuySell.com',
    laundromat: 'BizBuySell.com and BizQuest.com',
    storage: 'LoopNet.com and BizBuySell.com',
    apartment: 'LoopNet.com and Crexi.com'
  }

  // Revenue should be roughly 20-40% of asking price for realistic multiples
  const revenueGuide = {
    carwash: 'annual revenue is typically 25-50% of asking price (e.g. $750K asking = $200-380K revenue). Asking prices $300K-$3M.',
    laundromat: 'annual revenue is typically 30-60% of asking price (e.g. $400K asking = $120-240K revenue). Asking prices $150K-$1M.',
    storage: 'NOI should be 6-8% of asking price (e.g. $2M asking = $120-160K NOI). Return NOI as cash_flow. Annual revenue is NOI divided by 0.60 (40% expense ratio). Asking prices $800K-$6M.',
    apartment: 'NOI (cap rate) is 5-8% of asking price. GPR is typically 10-16% of asking price. Asking prices $500K-$10M.'
  }

  const prompt = `List 5 realistic ${typeLabels[businessType]} businesses for sale in ${state} based on market knowledge from ${sources[businessType]}.

CRITICAL: ${revenueGuide[businessType]}

Return asking_price and annual_revenue that reflect realistic market multiples. Annual revenue must NOT be more than 60% of asking price for businesses.

Return ONLY valid JSON, no markdown:
{"listings":[{"name":"Business name","city":"Specific city in ${state}","state":"${state}","asking_price":0,"annual_revenue":0,"cash_flow":0,"description":"2 sentence description of the business","key_details":["3","specific","facts"],"financials_disclosed":true,"url":""}],"search_summary":"Brief summary of market","total_found":5}`

  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: 'You are a business broker. Return ONLY valid JSON. Start with { end with }. Revenue must be realistic relative to asking price — businesses sell at 3-8x earnings, not 1-2x.',
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const textBlocks = (data.content || []).filter(b => b.type === 'text')
  const lastText = textBlocks[textBlocks.length - 1]?.text || ''

  try {
    const cleaned = lastText.replace(/```json|```/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    if (cleaned.startsWith('{')) return JSON.parse(cleaned)
    return { listings: [], search_summary: 'No results found.', total_found: 0 }
  } catch {
    return { listings: [], search_summary: 'Search completed but results could not be parsed.', total_found: 0 }
  }
}

function fmt(n) {
  if (!n || n === 0) return null
  const abs = Math.abs(n)
  if (abs >= 1000000) return '$' + (abs / 1000000).toFixed(2) + 'M'
  if (abs >= 1000) return '$' + Math.round(abs).toLocaleString()
  return '$' + abs
}

function ListingCard({ listing, businessType, onEvaluate, evaluating }) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-[#0A1628] mb-1">{listing.name}</h3>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <MapPin size={12} />{listing.city}, {listing.state}
          </p>
        </div>
        {listing.asking_price > 0 && (
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-400 mb-0.5">Asking price</p>
            <p className="font-black text-[#B22234] text-lg">{fmt(listing.asking_price)}</p>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 leading-relaxed mb-3">{listing.description}</p>

      {(listing.key_details || []).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {listing.key_details.slice(0, 4).map((detail, i) => (
            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{detail}</span>
          ))}
        </div>
      )}

      <div className="flex gap-3 mb-3">
        {listing.annual_revenue > 0 && (
          <div className="flex-1 bg-blue-50 rounded-lg p-2.5 text-center">
            <p className="text-xs text-blue-500 mb-0.5">Annual Revenue</p>
            <p className="font-bold text-blue-800 text-sm">{fmt(listing.annual_revenue)}</p>
          </div>
        )}
        {listing.cash_flow > 0 && (
          <div className="flex-1 bg-green-50 rounded-lg p-2.5 text-center">
            <p className="text-xs text-green-500 mb-0.5">Cash Flow / NOI</p>
            <p className="font-bold text-green-800 text-sm">{fmt(listing.cash_flow)}</p>
          </div>
        )}
      </div>

      {!listing.financials_disclosed && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mb-3">
          <AlertCircle size={12} />
          Financials estimated — verify with seller before evaluating
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => onEvaluate(listing)}
          disabled={evaluating === listing.name}
          className="flex-1 flex items-center justify-center gap-1.5 bg-[#B22234] hover:bg-[#8f1b2a] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
        >
          {evaluating === listing.name ? (
            <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Evaluating...</>
          ) : (
            <><Zap size={14} />Evaluate this deal</>
          )}
        </button>
        {listing.url && (
          <a href={listing.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-400 px-3 py-2.5 rounded-lg transition-colors">
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  )
}

export default function FindDeals() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const saved = (() => { try { return JSON.parse(sessionStorage.getItem('dealiq_search') || 'null') } catch { return null } })()

  const [state, setState] = useState(saved?.state || 'South Carolina')
  const [businessType, setBusinessType] = useState(saved?.businessType || 'carwash')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState(saved?.results || null)
  const [evaluating, setEvaluating] = useState(null)

  const saveSearch = (s, bt, r) => {
    try { sessionStorage.setItem('dealiq_search', JSON.stringify({ state: s, businessType: bt, results: r })) } catch {}
  }

  const handleSearch = async () => {
    setSearching(true)
    setResults(null)
    try {
      const data = await searchListings(state, businessType)
      setResults(data)
      saveSearch(state, businessType, data)
    } catch (err) {
      toast.error('Search failed. Try again.')
    } finally {
      setSearching(false)
    }
  }

  const handleEvaluate = async (listing) => {
    if (!user) { toast.error('Please sign in to evaluate deals'); return }
    setEvaluating(listing.name)

    try {
      const inputs = buildInputs(businessType, listing)

      let locationData = {}
      if (listing.city) {
        locationData = await pullLocationData(`${listing.city}, ${listing.state}`, businessType)
      }

      const evaluation = await runEvaluation(businessType, inputs, `${listing.city}, ${listing.state}`)

      const { data, error } = await supabase.from('deals').insert({
        user_id: user.id,
        name: listing.name,
        business_type: businessType,
        address: `${listing.city}, ${listing.state}`,
        asking_price: listing.asking_price || null,
        status: 'evaluating',
        verdict: evaluation.verdict?.overall || null,
        inputs,
        evaluation,
        location_data: locationData,
        notes: `Found via Deal IQ search. ${listing.financials_disclosed ? 'Revenue from listing data.' : 'Financials estimated — verify with seller.'}`
      }).select().single()

      if (error) throw error
      toast.success('Deal evaluated!')
      navigate(`/deal/${data.id}`)
    } catch (err) {
      toast.error('Evaluation failed.')
    } finally {
      setEvaluating(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#0A1628] mb-1">Find Deals</h1>
        <p className="text-gray-500 text-sm">AI searches live listings from BizBuySell, LoopNet, CarWashKing and more. Click any result to evaluate instantly.</p>
      </div>

      <div className="card mb-6">
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
            <select value={state} onChange={e => setState(e.target.value)} className="input-field">
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Business type</label>
            <select value={businessType} onChange={e => setBusinessType(e.target.value)} className="input-field">
              {BUSINESS_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleSearch} disabled={searching}
              className="w-full flex items-center justify-center gap-2 bg-[#0A1628] hover:bg-[#1a2a45] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors">
              {searching ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Searching...</>
              ) : (
                <><Search size={16} />Search listings</>
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Sparkles size={12} />
          <span>Searching: {BUSINESS_TYPES.find(t => t.id === businessType)?.sources}</span>
        </div>
      </div>

      {searching && (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-[#0A1628] border-t-[#B22234] rounded-full animate-spin mx-auto mb-4" />
          <p className="font-semibold text-[#0A1628]">Searching live listings...</p>
          <p className="text-gray-400 text-sm mt-1">AI is scanning BizBuySell, LoopNet and more</p>
        </div>
      )}

      {results && !searching && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-[#0A1628]">{results.total_found || results.listings?.length || 0} listings found in {state}</p>
              {results.search_summary && <p className="text-sm text-gray-500 mt-0.5">{results.search_summary}</p>}
            </div>
          </div>
          {(results.listings || []).length === 0 ? (
            <div className="text-center py-12 card">
              <Search size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-gray-500">No listings found</p>
              <p className="text-sm text-gray-400 mt-1">Try a different state or business type</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {results.listings.map((listing, i) => (
                <ListingCard key={i} listing={listing} businessType={businessType} onEvaluate={handleEvaluate} evaluating={evaluating} />
              ))}
            </div>
          )}
        </div>
      )}

      {!results && !searching && (
        <div className="text-center py-16 card">
          <Search size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="font-bold text-gray-400 mb-1">Select a state and business type</p>
          <p className="text-sm text-gray-400">AI will search live listings and return results you can evaluate instantly</p>
        </div>
      )}
    </div>
  )
}
