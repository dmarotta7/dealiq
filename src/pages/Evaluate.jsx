import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { runEvaluation, pullLocationData } from '../lib/anthropic'
import CarwashForm, { carwashDefaults } from '../components/evaluator/CarwashForm'
import ApartmentForm, { apartmentDefaults } from '../components/evaluator/ApartmentForm'
import { Car, Building2, Waves, Package, MapPin, Sparkles, ChevronRight, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const BUSINESS_TYPES = [
  { id: 'carwash',    label: 'Car Wash',       icon: Car,       desc: 'Express, flex-serve, or full-service washes', color: 'border-blue-200 hover:border-blue-400 bg-blue-50' },
  { id: 'apartment',  label: 'Multifamily',    icon: Building2, desc: 'Apartment buildings, duplexes, portfolio deals', color: 'border-purple-200 hover:border-purple-400 bg-purple-50' },
  { id: 'laundromat', label: 'Laundromat',     icon: Waves,     desc: 'Coin-op and card laundry businesses', color: 'border-teal-200 hover:border-teal-400 bg-teal-50', soon: true },
  { id: 'storage',    label: 'Self-Storage',   icon: Package,   desc: 'Climate & non-climate controlled facilities', color: 'border-amber-200 hover:border-amber-400 bg-amber-50', soon: true },
]

const DEFAULTS = {
  carwash: carwashDefaults,
  apartment: apartmentDefaults,
  laundromat: carwashDefaults,
  storage: apartmentDefaults,
}

export default function Evaluate() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [businessType, setBusinessType] = useState(null)
  const [dealName, setDealName] = useState('')
  const [address, setAddress] = useState('')
  const [inputs, setInputs] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')

  const handleTypeSelect = (type) => {
    setBusinessType(type)
    setInputs(DEFAULTS[type] || {})
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) { toast.error('Please sign in to save evaluations'); return }
    setLoading(true)

    try {
      // Step 1: Location intelligence
      let locationData = {}
      if (address) {
        setLoadingStep('Pulling location intelligence...')
        locationData = await pullLocationData(address, businessType)
      }

      // Step 2: Financial evaluation
      setLoadingStep('Evaluating financials...')
      const evaluation = await runEvaluation(businessType, inputs, address)

      if (evaluation.error) throw new Error(evaluation.error)

      // Step 3: Save to Supabase
      setLoadingStep('Saving deal...')
      const { data, error } = await supabase.from('deals').insert({
        user_id: user.id,
        name: dealName || `${BUSINESS_TYPES.find(t => t.id === businessType)?.label} — ${new Date().toLocaleDateString()}`,
        business_type: businessType,
        address: address,
        asking_price: inputs.price || null,
        status: 'evaluating',
        verdict: evaluation.verdict?.overall || null,
        inputs: inputs,
        evaluation: evaluation,
        location_data: locationData,
      }).select().single()

      if (error) throw error
      toast.success('Deal evaluated!')
      navigate(`/deal/${data.id}`)

    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Evaluation failed. Check your inputs and try again.')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#0A1628] border-t-[#B22234] rounded-full animate-spin" />
        <div className="text-center">
          <p className="font-bold text-[#0A1628] text-lg">Analyzing deal...</p>
          <p className="text-gray-500 text-sm mt-1">{loadingStep}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <span className={step >= 1 ? 'text-[#0A1628] font-semibold' : ''}>Select type</span>
        <ChevronRight size={14} />
        <span className={step >= 2 ? 'text-[#0A1628] font-semibold' : ''}>Enter details</span>
        <ChevronRight size={14} />
        <span className={step >= 3 ? 'text-[#0A1628] font-semibold' : ''}>Get verdict</span>
      </div>

      {/* Step 1: Business type */}
      {step === 1 && (
        <div>
          <h1 className="text-2xl font-black text-[#0A1628] mb-2">What type of business?</h1>
          <p className="text-gray-500 mb-8">Each business type has its own evaluation model and thresholds.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {BUSINESS_TYPES.map(type => {
              const Icon = type.icon
              return (
                <button
                  key={type.id}
                  onClick={() => !type.soon && handleTypeSelect(type.id)}
                  disabled={type.soon}
                  className={`relative text-left p-5 rounded-xl border-2 transition-all ${
                    type.soon
                      ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                      : `${type.color} cursor-pointer`
                  }`}
                >
                  {type.soon && (
                    <span className="absolute top-3 right-3 text-xs font-semibold bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Soon</span>
                  )}
                  <div className="flex items-start gap-3">
                    <Icon size={22} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-[#0A1628] mb-0.5">{type.label}</p>
                      <p className="text-sm text-gray-500">{type.desc}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 2: Form */}
      {step === 2 && (
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-[#0A1628]">Enter deal details</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {BUSINESS_TYPES.find(t => t.id === businessType)?.label} evaluation
              </p>
            </div>
            <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-gray-600 underline">
              Change type
            </button>
          </div>

          {/* Deal name & address */}
          <div className="card mb-6">
            <p className="section-header" style={{ marginTop: 0 }}>Deal info</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deal name</label>
                <input
                  type="text"
                  value={dealName}
                  onChange={e => setDealName(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Upstate SC Express Wash"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#B22234]" />
                    Property address
                    <span className="text-xs font-normal text-gray-400 italic">— AI pulls location data automatically</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="input-field"
                  placeholder="e.g. 123 Main St, Greenville SC"
                />
              </div>
            </div>
          </div>

          {/* Financial inputs */}
          <div className="card mb-6">
            {businessType === 'carwash' && <CarwashForm inputs={inputs} onChange={setInputs} />}
            {businessType === 'apartment' && <ApartmentForm inputs={inputs} onChange={(updates) => setInputs(prev => ({ ...prev, ...updates }))} />}
          </div>

          {/* Notice */}
          <div className="flex items-start gap-2 bg-blue-50 text-blue-800 text-sm px-4 py-3 rounded-lg border border-blue-200 mb-6">
            <Sparkles size={15} className="flex-shrink-0 mt-0.5" />
            <span>The AI will evaluate your financials, pull location intelligence from the address, and generate a complete deal verdict and 5-year model.</span>
          </div>

          <button type="submit" className="w-full btn-primary text-base py-4 flex items-center justify-center gap-2">
            <Sparkles size={18} />
            Evaluate this deal
          </button>
        </form>
      )}

    </div>
  )
}
