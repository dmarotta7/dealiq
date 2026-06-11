import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { runEvaluation, pullLocationData } from '../lib/anthropic'
import { carwashDefaults } from '../components/evaluator/CarwashForm'
import { apartmentDefaults } from '../components/evaluator/ApartmentForm'
import { laundryDefaults } from '../components/evaluator/LaundryForm'
import { storageDefaults } from '../components/evaluator/StorageForm'
import { Search, MapPin, DollarSign, ChevronRight, Sparkles, AlertCircle, ExternalLink, Zap } from 'lucide-react'
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

async function searchListings(state, businessType) {
  const typeLabels = {
    carwash: 'car wash',
    laundromat: 'laundromat',
    storage: 'self-storage facility',
    apartment: 'multifamily apartment building'
  }

  const sources = {
    carwash: 'CarWashKing.com, BizBuySell.com, and BizQuest.com',
    laundromat: 'BizBuySell.com and BizQuest.com',
    storage: 'LoopNet.com and BizBuySell.com',
    apartment: 'LoopNet.com, Crexi.com, and Marcus & Millichap listings'
  }

  const prompt = `Search for ${typeLabels[businessType]} businesses currently for sale in ${state}. 
Search ${sources[businessType]} for active listings.

For each listing found, extract:
- Business name or listing title
- City and state
- Asking price
- Annual revenue (if disclosed)
- Cash flow or EBITDA or NOI (if disclosed)  
- Key details (size, equipment, occupancy, membership count, etc.)
- Listing URL if available
- Any financials that could pre-fill an evaluation form

Return ONLY valid JSON with this exact structure:
{
  "listings": [
    {
      "name": "listing name",
      "city": "city name",
      "state": "${state}",
      "asking_price": 0,
      "annual_revenue": 0,
      "cash_flow": 0,
      "description": "2-3 sentence summary of the listing",
      "key_details": ["detail 1", "detail 2", "detail 3"],
      "financials_disclosed": true,
      "url": "listing url or empty string",
      "pre_fill": {
        "price": 0,
        "note": "any fields that can be pre-filled based on disclosed financials"
      }
    }
  ],
  "search_summary": "brief summary of what was found",
  "total_found": 0
}`

  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      system: 'You are a business acquisition analyst. Search the web for real, active business listings. Return ONLY valid JSON, no markdown, no preamble.',
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  
  // Web search responses can have multiple content blocks
  // Find the last text block which contains the final JSON response
  const textBlocks = (data.content || []).filter(b => b.type === 'text')
  const lastText = textBlocks[textBlocks.length - 1]?.text || ''
  
  try {
    const cleaned = lastText.replace(/```json|```/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    if (cleaned.startsWith('{')) return JSON.parse(cleaned)
    return { listings: [], search_summary: 'Search completed but results could not be parsed.', total_found: 0 }
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
          Financials not disclosed — evaluation will use industry averages
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => onEvaluate(listing)}
          disabled={evaluating === listing.name}
          className="flex-1 flex items-center justify-center gap-1.5 bg-[#B22234] hover:bg-[#8f1b2a] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
        >
          {evaluating === listing.name ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Evaluating...
            </>
          ) : (
            <>
              <Zap size={14} />
              Evaluate this deal
            </>
          )}
        </button>
        {listing.url && (
          <a
            href={listing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-400 px-3 py-2.5 rounded-lg transition-colors"
          >
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
  const [state, setState] = useState('South Carolina')
  const [businessType, setBusinessType] = useState('carwash')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState(null)
  const [evaluating, setEvaluating] = useState(null)

  const handleSearch = async () => {
    setSearching(true)
    setResults(null)
    try {
      const data = await searchListings(state, businessType)
      setResults(data)
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
      const defaults = DEFAULTS[businessType] || DEFAULTS.carwash
      const inputs = {
        ...defaults,
        ...(listing.pre_fill || {}),
        price: listing.asking_price || defaults.price,
      }

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
        notes: `Found via Deal IQ search. ${listing.financials_disclosed ? 'Financials from listing.' : 'Financials estimated from industry averages — verify with seller.'}`
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

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#0A1628] mb-1">Find Deals</h1>
        <p className="text-gray-500 text-sm">AI searches live listings from BizBuySell, LoopNet, CarWashKing and more. Click any result to evaluate instantly.</p>
      </div>

      {/* Search controls */}
      <div className="card mb-6">
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
            <select
              value={state}
              onChange={e => setState(e.target.value)}
              className="input-field"
            >
              {US_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Business type</label>
            <select
              value={businessType}
              onChange={e => setBusinessType(e.target.value)}
              className="input-field"
            >
              {BUSINESS_TYPES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={searching}
              className="w-full flex items-center justify-center gap-2 bg-[#0A1628] hover:bg-[#1a2a45] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {searching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Search listings
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Sparkles size={12} />
          <span>Searching: {BUSINESS_TYPES.find(t => t.id === businessType)?.sources}</span>
        </div>
      </div>

      {/* Loading */}
      {searching && (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-[#0A1628] border-t-[#B22234] rounded-full animate-spin mx-auto mb-4" />
          <p className="font-semibold text-[#0A1628]">Searching live listings...</p>
          <p className="text-gray-400 text-sm mt-1">AI is scanning BizBuySell, LoopNet and more</p>
        </div>
      )}

      {/* Results */}
      {results && !searching && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-[#0A1628]">
                {results.total_found || results.listings?.length || 0} listings found in {state}
              </p>
              {results.search_summary && (
                <p className="text-sm text-gray-500 mt-0.5">{results.search_summary}</p>
              )}
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
                <ListingCard
                  key={i}
                  listing={listing}
                  businessType={businessType}
                  onEvaluate={handleEvaluate}
                  evaluating={evaluating}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
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
