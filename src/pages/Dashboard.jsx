import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { PlusCircle, Building2, Car, Waves, Package, ChevronRight, TrendingUp, TrendingDown, Minus, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react'

const TYPE_CONFIG = {
  carwash:    { label: 'Car Wash',       icon: Car,       color: 'bg-blue-50 text-blue-600' },
  laundromat: { label: 'Laundromat',     icon: Waves,     color: 'bg-teal-50 text-teal-600' },
  storage:    { label: 'Self-Storage',   icon: Package,   color: 'bg-amber-50 text-amber-600' },
  apartment:  { label: 'Multifamily',    icon: Building2, color: 'bg-purple-50 text-purple-600' },
}

const STATUS_CONFIG = {
  evaluating:    { label: 'Evaluating',      color: 'bg-gray-100 text-gray-600' },
  loi_submitted: { label: 'LOI Submitted',   color: 'bg-blue-100 text-blue-700' },
  under_contract:{ label: 'Under Contract',  color: 'bg-amber-100 text-amber-700' },
  passed:        { label: 'Passed',          color: 'bg-gray-100 text-gray-500' },
  closed:        { label: 'Closed',          color: 'bg-green-100 text-green-700' },
}

function VerdictBadge({ verdict }) {
  if (verdict === 'Pass') return <span className="badge-pass"><CheckCircle size={11} /> Pass</span>
  if (verdict === 'Warn') return <span className="badge-warn"><Minus size={11} /> Watch</span>
  return <span className="badge-fail"><XCircle size={11} /> Fail</span>
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

export default function Dashboard() {
  const { user } = useAuth()
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchDeals()
  }, [user])

  async function fetchDeals() {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) setDeals(data || [])
    setLoading(false)
  }

  async function deleteDeal(id) {
    if (!confirm('Delete this deal?')) return
    await supabase.from('deals').delete().eq('id', id)
    setDeals(prev => prev.filter(d => d.id !== id))
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

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#0A1628]">Deal Pipeline</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {user?.email} · {deals.length} deal{deals.length !== 1 ? 's' : ''} evaluated
          </p>
        </div>
        <Link to="/evaluate" className="btn-primary flex items-center gap-2">
          <PlusCircle size={16} />
          New deal
        </Link>
      </div>

      {/* Stats */}
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

      {/* Filter tabs */}
      {deals.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'evaluating', 'loi_submitted', 'under_contract', 'closed', 'passed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-[#0A1628] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'All deals' : STATUS_CONFIG[f]?.label || f}
            </button>
          ))}
        </div>
      )}

      {/* Deal list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#0A1628] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {filtered.map(deal => {
            const typeConfig = TYPE_CONFIG[deal.business_type] || TYPE_CONFIG.carwash
            const Icon = typeConfig.icon
            const statusConfig = STATUS_CONFIG[deal.status] || STATUS_CONFIG.evaluating

            return (
              <div key={deal.id} className="card hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${typeConfig.color} flex-shrink-0`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-[#0A1628] truncate">{deal.name || 'Unnamed Deal'}</h3>
                      {deal.verdict && <VerdictBadge verdict={deal.verdict} />}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
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
                    <button
                      onClick={() => deleteDeal(deal.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                    </button>
                    <Link
                      to={`/deal/${deal.id}`}
                      className="flex items-center gap-1 text-sm font-semibold text-[#0A1628] hover:text-[#B22234] transition-colors"
                    >
                      View <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
