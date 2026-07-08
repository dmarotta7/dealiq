import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { runEvaluation, pullLocationData } from '../lib/anthropic'
import { buildInputs } from './FindDeals'
import { PlusCircle, Building2, Car, Waves, Package, ChevronRight, TrendingUp, TrendingDown, Minus, Clock, CheckCircle, XCircle, Trash2, BookmarkCheck, ChevronDown, ChevronUp, MapPin, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const TYPE_CONFIG = {
  carwash:    { label: 'Car Wash',     icon: Car,       color: 'bg-blue-50 text-blue-600' },
  laundromat: { label: 'Laundromat',   icon: Waves,     color: 'bg-teal-50 text-teal-600' },
  storage:    { label: 'Self-Storage', icon: Package,   color: 'bg-amber-50 text-amber-600' },
  apartment:  { label: 'Multifamily',  icon: Building2, color: 'bg-purple-50 text-purple-600' },
}

const STATUS_CONFIG = {
  evaluating:     { label: 'Evaluating',     color: 'bg-gray-100 text-gray-600' },
  loi_submitted:  { label: 'LOI Submitted',  color: 'bg-blue-100 text-blue-700' },
  under_contract: { label: 'Under Contract', color: 'bg-amber-100 text-amber-700' },
  passed:         { label: 'Passed',         color: 'bg-gray-100 text-gray-500' },
  closed:         { label: 'Closed',         color: 'bg-green-100 text-green-700' },
}

function VerdictBadge({ verdict }) {
  if (verdict === 'Pass') return <span className="badge-pass"><CheckCircle size={11} /> Pass</span>
  if (verdict === 'Warn') return <span className="badge-warn"><Minus size={11} /> Watch</span>
  return <span className="badge-fail"><XCircle size={11} /> Fail</span>
}

function fmt(n) {
  if (!n || n === 0) return null
  const abs = Math.abs(n)
  if (abs >= 1000000) return '$' + (abs / 1000000).toFixed(2) + 'M'
  if (abs >= 1000) return '$' + Math.round(abs).toLocaleString()
  return '$' + abs
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-[#E8ECF4] rounded-2xl flex items-center justify-center mx-auto mb-4">
        <TrendingUp size={28} className="text-[#0A1628]" />
      </div>
      <h3 className="text-lg font-bold text-[#0A1628] mb-2">No deals yet</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm">Start evaluating deals to build your pipeline. Each evaluation takes about 90 seconds.</p>
      <Link to="/evaluate" className="btn-primary inline-flex items-center gap-2">
        <PlusCircle size={16} />
        Evaluate your first deal
      </Link>
    </div>
  )
}

function SavedSearchCard({ search, onDelete, onEvaluate, evaluating }) {
  const [expanded, setExpanded] = useState(false)
  const typeConfig = TYPE_CONFIG[search.business_type] || TYPE_CONFIG.carwash
  const Icon = typeConfig.icon

  return (
    <div className="card border border-gray-200">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${typeConfig.color} flex-shrink-0`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-[#0A1628]">{typeConfig.label} — {search.state}</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {search.listing_count} listings
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Clock size={11} />{new Date(search.created_at).toLocaleDateString()}</span>
            {search.search_summary && <span className="truncate max-w-xs hidden sm:block">· {search.search_summary}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => onDelete(search.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
            <Trash2 size={15} />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-sm font-semibold text-[#0A1628] hover:text-[#B22234] transition-colors">
            {expanded ? <><ChevronUp size={16} />Hide</> : <><ChevronDown size={16} />View</>}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
          {(search.listings || []).map((listing, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#0A1628] truncate">{listing.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={10} />{listing.city}, {listing.state}
                  {listing.asking_price > 0 && <span className="ml-2 font-medium text-gray-700">{fmt(listing.asking_price)}</span>}
                </p>
              </div>
              <button
                onClick={() => onEvaluate(listing, search.business_type)}
                disabled={evaluating === listing.name}
                className="flex items-center gap-1 bg-[#B22234] hover:bg-[#8f1b2a] disabled:opacity-60 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors flex-shrink-0"
              >
                {evaluating === listing.name
                  ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Evaluating...</>
                  : <><Zap size={11} />Evaluate</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [deals, setDeals] = useState([])
  const [savedSearches, setSavedSearches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [evaluating, setEvaluating] = useState(null)
  const [activeTab, setActiveTab] = useState('pipeline')

  useEffect(() => {
    fetchAll()
  }, [user])

  async function fetchAll() {
    if (!user) return
    setLoading(true)
    const [dealsRes, searchesRes] = await Promise.all([
      supabase.from('deals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('saved_searches').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    ])
    if (!dealsRes.error) setDeals(dealsRes.data || [])
    if (!searchesRes.error) setSavedSearches(searchesRes.data || [])
    setLoading(false)
  }

  async function deleteDeal(id) {
    if (!confirm('Delete this deal?')) return
    await supabase.from('deals').delete().eq('id', id)
    setDeals(prev => prev.filter(d => d.id !== id))
  }

  async function deleteSavedSearch(id) {
    if (!confirm('Delete this saved search?')) return
    await supabase.from('saved_searches').delete().eq('id', id)
    setSavedSearches(prev => prev.filter(s => s.id !== id))
  }

  async function evaluateFromSearch(listing, businessType) {
    if (!user) return
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
        notes: `Evaluated from saved search. ${listing.financials_disclosed ? 'Revenue from listing data.' : 'Financials estimated.'}`
      }).select().single()
      if (error) throw error
      toast.success('Deal evaluated!')
      navigate(`/deal/${data.id}`)
    } catch {
      toast.error('Evaluation failed.')
    } finally {
      setEvaluating(null)
    }
  }

  const filtered = filter === 'all' ? deals : deals.filter(d => d.status === filter)
  const stats = {
    total: deals.length,
    pass: deals.filter(d => d.verdict === 'Pass').length,
    warn: deals.filter(d => d.verdict === 'Warn').length,
    fail: deals.filter(d => d.verdict === 'Fail').length,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#0A1628]">Deal Pipeline</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {user?.email} · {deals.length} deal{deals.length !== 1 ? 's' : ''} evaluated
          </p>
        </div>
        <Link to="/evaluate" className="btn-primary flex items-center gap-2">
          <PlusCircle size={16} />
          <span className="hidden sm:block">New deal</span>
        </Link>
      </div>

      {deals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Deals', value: stats.total, icon: TrendingUp, color: 'text-[#0A1628]' },
            { label: 'Pass', value: stats.pass, icon: TrendingUp, color: 'text-green-600' },
            { label: 'Watch', value: stats.warn, icon: Minus, color: 'text-amber-600' },
            { label: 'Fail', value: stats.fail, icon: TrendingDown, color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="card">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'pipeline' ? 'border-[#0A1628] text-[#0A1628]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Deal Pipeline ({deals.length})
        </button>
        <button
          onClick={() => setActiveTab('searches')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'searches' ? 'border-[#0A1628] text-[#0A1628]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          <BookmarkCheck size={14} />
          Saved Searches ({savedSearches.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#0A1628] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === 'pipeline' ? (
        <>
          {deals.length > 0 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 flex-nowrap">
              {['all', 'evaluating', 'loi_submitted', 'under_contract', 'closed', 'passed'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${filter === f ? 'bg-[#0A1628] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {f === 'all' ? 'All deals' : STATUS_CONFIG[f]?.label || f}
                </button>
              ))}
            </div>
          )}
          {filtered.length === 0 ? <EmptyState /> : (
            <div className="space-y-3">
              {filtered.map(deal => {
                const typeConfig = TYPE_CONFIG[deal.business_type] || TYPE_CONFIG.carwash
                const Icon = typeConfig.icon
                const statusConfig = STATUS_CONFIG[deal.status] || STATUS_CONFIG.evaluating
                return (
                  <div key={deal.id} className="card hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${typeConfig.color} flex-shrink-0`}><Icon size={20} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-[#0A1628]">{deal.name || 'Unnamed Deal'}</h3>
                          {deal.verdict && <VerdictBadge verdict={deal.verdict} />}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusConfig.color}`}>{statusConfig.label}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                          <span>{typeConfig.label}</span>
                          {deal.address && <><span>·</span><span className="truncate max-w-xs">{deal.address}</span></>}
                          {deal.asking_price && <><span>·</span><span className="font-medium text-gray-700">${Number(deal.asking_price).toLocaleString()}</span></>}
                          <span>·</span>
                          <span className="flex items-center gap-1"><Clock size={11} />{new Date(deal.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => deleteDeal(deal.id)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all rounded-lg hover:bg-red-50">
                          <Trash2 size={15} />
                        </button>
                        <Link to={`/deal/${deal.id}`} className="flex items-center gap-1 text-sm font-semibold text-[#0A1628] hover:text-[#B22234] transition-colors">
                          View <ChevronRight size={16} />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {savedSearches.length === 0 ? (
            <div className="text-center py-16 card">
              <BookmarkCheck size={40} className="text-gray-200 mx-auto mb-4" />
              <p className="font-bold text-gray-400 mb-1">No saved searches yet</p>
              <p className="text-sm text-gray-400">Run a search in Find Deals and click Save to dashboard</p>
              <Link to="/find-deals" className="btn-primary inline-flex items-center gap-2 mt-4">
                <TrendingUp size={16} />Find Deals
              </Link>
            </div>
          ) : savedSearches.map(search => (
            <SavedSearchCard
              key={search.id}
              search={search}
              onDelete={deleteSavedSearch}
              onEvaluate={evaluateFromSearch}
              evaluating={evaluating}
            />
          ))}
        </div>
      )}
    </div>
  )
}
