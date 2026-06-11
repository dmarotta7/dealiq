import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { askDealAssistant } from '../lib/anthropic'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { CheckCircle, XCircle, Minus, MapPin, Send, Download, ArrowLeft, AlertTriangle, Star, Tag } from 'lucide-react'

function fmt(n) {
  if (n === null || n === undefined || isNaN(Number(n))) return '—'
  const num = Number(n)
  const abs = Math.abs(num)
  if (abs >= 1000000) return (num < 0 ? '-' : '') + '$' + (abs / 1000000).toFixed(2) + 'M'
  if (abs >= 1000) return (num < 0 ? '-' : '') + '$' + Math.round(abs).toLocaleString()
  return (num < 0 ? '-' : '') + '$' + abs.toFixed(0)
}
function pct(n) {
  if (n === null || n === undefined) return '—'
  const num = Number(n)
  if (isNaN(num)) return '—'
  return (num * 100).toFixed(1) + '%'
}
function xval(n) {
  if (n === null || n === undefined || isNaN(Number(n))) return '—'
  return Number(n).toFixed(2) + 'x'
}

function VerdictBanner({ verdict, score, recommendation }) {
  const configs = {
    Pass: { bg: 'bg-green-600', icon: CheckCircle, label: 'DEAL PASSES' },
    Warn: { bg: 'bg-amber-500', icon: AlertTriangle, label: 'PROCEED WITH CAUTION' },
    Fail: { bg: 'bg-[#B22234]', icon: XCircle, label: 'DEAL FAILS THRESHOLDS' },
  }
  const cfg = configs[verdict] || configs.Fail
  const Icon = cfg.icon
  return (
    <div className={`${cfg.bg} text-white rounded-2xl p-6 mb-6`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon size={28} />
        <span className="font-black text-2xl tracking-wide">{cfg.label}</span>
        {score > 0 && <span className="ml-auto text-3xl font-black opacity-80">{score}/100</span>}
      </div>
      {recommendation && <p className="text-white/90 text-sm leading-relaxed">{recommendation}</p>}
    </div>
  )
}

function ThresholdRow({ name, actual, target, status }) {
  const icons = {
    Pass: <CheckCircle size={16} className="text-green-500 flex-shrink-0" />,
    Warn: <Minus size={16} className="text-amber-500 flex-shrink-0" />,
    Fail: <XCircle size={16} className="text-red-500 flex-shrink-0" />
  }
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      {icons[status] || icons.Fail}
      <span className="flex-1 text-sm font-medium text-gray-700">{name}</span>
      <span className="text-sm font-bold text-[#0A1628]">{actual}</span>
      <span className="text-xs text-gray-400 w-16 text-right">{target}</span>
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="card text-center">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-2xl font-black text-[#0A1628]">{value}</p>
    </div>
  )
}

function PriceRecommendation({ ev, deal }) {
  const isCarWash = deal.business_type === 'carwash'
  const isLaundromat = deal.business_type === 'laundromat'
  const isStorage = deal.business_type === 'storage'
  const isBusinessAcq = isCarWash || isLaundromat
  const isRealEstate = !isBusinessAcq
  const metrics = ev.metrics || {}
  const recast = ev.recast || {}
  const inputs = deal.inputs || {}

  const askingPrice = inputs.price || 0
  const dp_pct = inputs.dp_pct || (isBusinessAcq ? 20 : 25)
  const rate = inputs.rate || (isBusinessAcq ? 7.5 : 6.75)
  const term = inputs.term || (isBusinessAcq ? 10 : 25)

  const earnings = isBusinessAcq ? (recast.recast_ebitda || 0) : (metrics.noi || 0)
  const standardMultiple = isCarWash ? 6 : isLaundromat ? 5 : null
  const targetCapRate = isRealEstate ? 0.06 : null
  const fairMarket = isBusinessAcq ? earnings * standardMultiple : earnings / targetCapRate

  // Minimum viable price — where DSCR = 1.25x
  // DSCR = earnings / DS = 1.25 → DS = earnings / 1.25
  // DS = loan * monthlyRate * (1+r)^n / ((1+r)^n - 1) * 12
  // Solve for price given DS target
  const targetDS = earnings / 1.25
  const r = rate / 100 / 12
  const n = term * 12
  const ltvFactor = 1 - dp_pct / 100
  const dsPerDollar = ltvFactor * (r * Math.pow(1+r,n)) / (Math.pow(1+r,n) - 1) * 12
  const maxViablePrice = dsPerDollar > 0 ? targetDS / dsPerDollar : 0

  // Target offer = 10% below fair market
  const targetOffer = fairMarket * 0.90

  // Percent gap from asking
  const gapPct = askingPrice > 0 ? ((askingPrice - fairMarket) / fairMarket * 100) : 0

  if (earnings <= 0) return null

  return (
    <div className="card mb-6 border-2 border-[#0A1628]">
      <div className="flex items-center gap-2 mb-4">
        <Tag size={18} className="text-[#0A1628]" />
        <h2 className="font-bold text-[#0A1628]">Purchase price recommendation</h2>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Target offer</p>
          <p className="text-2xl font-black text-green-700">{fmt(targetOffer)}</p>
          <p className="text-xs text-green-600 mt-1">Your opening LOI number</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Fair market value</p>
          <p className="text-2xl font-black text-blue-800">{fmt(fairMarket)}</p>
          <p className="text-xs text-blue-600 mt-1">{isCarWash ? '6x EBITDA' : isLaundromat ? '5x EBITDA' : '6.0% cap rate'}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Walk-away price</p>
          <p className="text-2xl font-black text-amber-700">{fmt(maxViablePrice)}</p>
          <p className="text-xs text-amber-600 mt-1">Max for positive cash flow</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-600">Asking price vs. fair market</span>
          <span className={`text-sm font-bold ${gapPct > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {gapPct > 0 ? '+' : ''}{gapPct.toFixed(1)}% {gapPct > 0 ? 'overpriced' : 'underpriced'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Asking price</p>
            <p className="font-bold text-[#B22234]">{fmt(askingPrice)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Fair market</p>
            <p className="font-bold text-[#0A1628]">{fmt(fairMarket)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Dollar gap</p>
            <p className="font-bold text-[#B22234]">{fmt(askingPrice - fairMarket)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Implied multiple</p>
            <p className="font-bold text-[#0A1628]">{earnings > 0 ? (askingPrice / earnings).toFixed(1) + 'x' : '—'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DealResults() {
  const { id } = useParams()
  const [deal, setDeal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    supabase.from('deals').select('*').eq('id', id).single()
      .then(({ data }) => { setDeal(data); setLoading(false) })
  }, [id])

  const sendMessage = async () => {
    if (!chatInput.trim() || !deal) return
    const question = chatInput
    setChatInput('')
    const newHistory = [...chatHistory, { role: 'user', content: question }]
    setChatHistory(newHistory)
    setChatLoading(true)
    try {
      const answer = await askDealAssistant(
        { ...deal.evaluation, location: deal.location_data, inputs: deal.inputs },
        question,
        chatHistory
      )
      setChatHistory([...newHistory, { role: 'assistant', content: answer }])
    } catch {
      setChatHistory([...newHistory, { role: 'assistant', content: 'Error processing question.' }])
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-[#0A1628] border-t-[#B22234] rounded-full animate-spin" />
    </div>
  )

  if (!deal) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="text-gray-500">Deal not found.</p>
      <Link to="/dashboard" className="btn-primary mt-4 inline-block">Back to dashboard</Link>
    </div>
  )

  const ev = deal.evaluation || {}
  const loc = deal.location_data || {}
  const verdict = ev.verdict || {}
  const metrics = ev.metrics || {}
  const recast = ev.recast || {}
  const projection = ev.projection || {}
  const exit = ev.exit || {}
  const isCarWash = deal.business_type === 'carwash'
  const isLaundromat = deal.business_type === 'laundromat'
  const isStorage = deal.business_type === 'storage'
  const isBusinessAcq = isCarWash || isLaundromat

  const chartData = ['year1','year2','year3','year4','year5'].map((yr, i) => {
    const y = projection[yr] || {}
    return {
      name: `Yr ${i + 1}`,
      ebitda: Math.round(y.ebitda || y.noi || 0),
      debt_service: Math.round(Math.abs(y.debt_service || 0)),
      cash_flow: Math.round(y.free_cash_flow || y.cash_flow || 0),
    }
  })

  const locationScore = loc.location_score || ''
  const scoreColor = locationScore === 'Strong' ? 'text-green-600 bg-green-50' :
    locationScore === 'Moderate' ? 'text-amber-600 bg-amber-50' : 'text-gray-600 bg-gray-100'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-black text-[#0A1628]">{deal.name}</h1>
          {deal.address && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin size={12} />{deal.address}
            </p>
          )}
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:border-gray-400 text-sm font-medium px-3 py-2 rounded-lg transition-colors">
          <Download size={15} /> Export PDF
        </button>
      </div>

      <VerdictBanner verdict={verdict.overall} score={verdict.score} recommendation={verdict.recommendation} />

      {(verdict.thresholds || []).length > 0 && (
        <div className="card mb-6">
          <h2 className="font-bold text-[#0A1628] mb-1">Threshold scorecard</h2>
          <p className="text-xs text-gray-400 mb-4">Evaluated against institutional acquisition standards</p>
          {verdict.thresholds.map((t, i) => <ThresholdRow key={i} {...t} />)}
        </div>
      )}

      <PriceRecommendation ev={ev} deal={deal} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {isBusinessAcq ? (
          <>
            <MetricCard label="Recast EBITDA" value={fmt(recast.recast_ebitda)} />
            <MetricCard label="EBITDA Margin" value={pct(recast.ebitda_margin)} />
            <MetricCard label="Purchase Multiple" value={xval(metrics.ebitda_multiple)} />
            <MetricCard label="DSCR" value={xval(metrics.dscr)} />
            <MetricCard label="Cash-on-Cash" value={pct(metrics.cash_on_cash)} />
            <MetricCard label="Year 1 Cash Flow" value={fmt(metrics.year1_cash_flow)} />
            <MetricCard label="5-yr IRR" value={pct(exit.irr)} />
            <MetricCard label="Equity Multiple" value={xval(exit.equity_multiple)} />
          </>
        ) : isStorage ? (
          <>
            <MetricCard label="NOI" value={fmt(metrics.noi)} />
            <MetricCard label="Cap Rate" value={pct(metrics.cap_rate)} />
            <MetricCard label="Physical Occupancy" value={metrics.physical_occupancy ? metrics.physical_occupancy.toFixed(1) + '%' : '—'} />
            <MetricCard label="DSCR" value={xval(metrics.dscr)} />
            <MetricCard label="Cash-on-Cash" value={pct(metrics.cash_on_cash)} />
            <MetricCard label="Year 1 Cash Flow" value={fmt(metrics.year1_cash_flow)} />
            <MetricCard label="5-yr IRR" value={pct(exit.irr)} />
            <MetricCard label="Price / Unit" value={fmt(metrics.price_per_unit)} />
          </>
        ) : (
          <>
            <MetricCard label="NOI" value={fmt(metrics.noi)} />
            <MetricCard label="Cap Rate" value={pct(metrics.cap_rate)} />
            <MetricCard label="DSCR" value={xval(metrics.dscr)} />
            <MetricCard label="Cash-on-Cash" value={pct(metrics.cash_on_cash)} />
            <MetricCard label="Price / Unit" value={fmt(metrics.price_per_unit)} />
            <MetricCard label="Year 1 Cash Flow" value={fmt(metrics.year1_cash_flow)} />
            <MetricCard label="5-yr IRR" value={pct(exit.irr)} />
            <MetricCard label="Equity Multiple" value={xval(exit.equity_multiple)} />
          </>
        )}
      </div>

      {chartData.some(d => d.ebitda > 0) && (
        <div className="card mb-6">
          <h2 className="font-bold text-[#0A1628] mb-4">5-year cash flow projection</h2>
          <div className="flex gap-4 mb-3 flex-wrap text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#0A1628] inline-block" /> EBITDA/NOI</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#B22234] inline-block" /> Debt service</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#3C3B6E] inline-block opacity-70" /> Free cash flow</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => '$' + (Math.abs(v) >= 1000 ? (v/1000).toFixed(0) + 'K' : v)} />
              <Tooltip formatter={v => fmt(v)} />
              <Bar dataKey="ebitda" fill="#0A1628" radius={[4,4,0,0]} name="EBITDA/NOI" />
              <Bar dataKey="debt_service" fill="#B22234" radius={[4,4,0,0]} name="Debt Service" />
              <Bar dataKey="cash_flow" fill="#3C3B6E" radius={[4,4,0,0]} name="Free Cash Flow" opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {exit.gross_exit_value > 0 && (
        <div className="card mb-6">
          <h2 className="font-bold text-[#0A1628] mb-4">Year 5 exit analysis</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              ['Gross exit value', fmt(exit.gross_exit_value || exit.exit_value)],
              ['Selling costs', fmt(exit.selling_costs)],
              ['Remaining loan balance', fmt(exit.remaining_loan_balance)],
              ['Net sale proceeds', fmt(exit.net_proceeds)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-bold text-[#0A1628]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[#0A1628]">Location intelligence</h2>
          {locationScore && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${scoreColor}`}>
              {locationScore} location
            </span>
          )}
        </div>
        {loc.market_context && <p className="text-sm text-gray-600 mb-4 leading-relaxed">{loc.market_context}</p>}
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            ['Daily traffic', loc.traffic_count || '—'],
            ['Competitors nearby', loc.competitor_count != null ? `${loc.competitor_count} within 3 mi` : '—'],
            ['Median HH income', loc.median_household_income ? fmt(loc.median_household_income) : '—'],
            ['Renter population', loc.renter_percentage ? loc.renter_percentage + '%' : '—'],
            ['Population (5-mi)', loc.population_5mi ? Number(loc.population_5mi).toLocaleString() : '—'],
            ['Population trend', loc.population_growth || '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-sm font-bold text-[#0A1628]">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {((verdict.red_flags || []).length > 0 || (verdict.strengths || []).length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {(verdict.red_flags || []).length > 0 && (
            <div className="card">
              <h3 className="font-bold text-[#B22234] mb-3 flex items-center gap-1.5"><AlertTriangle size={15} /> Red flags</h3>
              <ul className="space-y-2">
                {verdict.red_flags.map((f, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(verdict.strengths || []).length > 0 && (
            <div className="card">
              <h3 className="font-bold text-green-700 mb-3 flex items-center gap-1.5"><Star size={15} /> Strengths</h3>
              <ul className="space-y-2">
                {verdict.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="font-bold text-[#0A1628] mb-1">AI deal assistant</h2>
        <p className="text-xs text-gray-400 mb-4">Ask anything about this deal — it knows all the numbers.</p>
        {chatHistory.length > 0 && (
          <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#0A1628] text-white' : 'bg-gray-50 text-gray-700 border border-gray-200'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <div className="flex gap-1">
                    {[0,150,300].map(d => <span key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}} />)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {chatHistory.length === 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {["What's the biggest risk?","What price makes this a pass?","Draft an LOI at target offer price","How does IRR change at fair market value?"].map(q => (
              <button key={q} onClick={() => setChatInput(q)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full transition-colors">{q}</button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Ask about this deal..." className="input-field flex-1" />
          <button onClick={sendMessage} disabled={!chatInput.trim() || chatLoading} className="bg-[#0A1628] hover:bg-[#1a2a45] disabled:opacity-50 text-white p-2.5 rounded-lg transition-colors">
            <Send size={16} />
          </button>
        </div>
      </div>

    </div>
  )
}
