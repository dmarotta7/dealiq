import { Link } from 'react-router-dom'
import { CheckCircle, Zap, MapPin, FileText, TrendingUp, Building2, Waves, Package, Car } from 'lucide-react'

const BUSINESS_TYPES = [
  { icon: Car, label: 'Car Wash', color: 'text-blue-600 bg-blue-50' },
  { icon: Waves, label: 'Laundromat', color: 'text-teal-600 bg-teal-50' },
  { icon: Package, label: 'Self-Storage', color: 'text-amber-600 bg-amber-50' },
  { icon: Building2, label: 'Apartment Buildings', color: 'text-purple-600 bg-purple-50' },
]

const FEATURES = [
  { icon: Zap, title: 'Deal verdict in 90 seconds', desc: 'Enter the asking price and financials. AI handles the rest.' },
  { icon: MapPin, title: 'AI location intelligence', desc: 'Auto-pulls traffic count, competitors, income, and market data from the address.' },
  { icon: FileText, title: 'PDF reports, lender-ready', desc: 'One tap generates a branded report you can hand to a lender or partner.' },
  { icon: TrendingUp, title: '5-year IRR & exit model', desc: 'Full projection model with DSCR, CoC, IRR, equity multiple, and deal verdict.' },
]

const THRESHOLDS = [
  { label: 'DSCR', target: '≥ 1.25x', desc: 'Debt coverage ratio' },
  { label: 'Cash-on-Cash', target: '≥ 7–15%', desc: 'Annual yield on equity' },
  { label: 'IRR', target: '≥ 14–20%', desc: '5-year internal rate of return' },
  { label: 'EBITDA Multiple', target: '≤ 6x', desc: 'Purchase price vs. earnings' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div className="bg-[#0A1628] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-[#1a2a45] text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Now in beta — 4 business types supported
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-6">
            Evaluate any business deal
            <br />
            <span className="text-[#B22234]">in 90 seconds.</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Enter the asking price and basic financials. Deal IQ pulls location intelligence automatically and returns a complete deal verdict with a lender-ready PDF report.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="bg-[#B22234] hover:bg-[#8f1b2a] text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg w-full sm:w-auto"
            >
              Start evaluating deals — free
            </Link>
            <Link
              to="/login"
              className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors w-full sm:w-auto"
            >
              Sign in
            </Link>
          </div>
          <p className="text-gray-500 text-sm mt-4">No credit card required. 3 free evaluations to start.</p>
        </div>
      </div>

      {/* Business types */}
      <div className="bg-gray-50 border-b border-gray-200 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold text-gray-400 tracking-widest uppercase mb-8">Supported business types</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {BUSINESS_TYPES.map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex flex-col items-center gap-2 bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <div className={`p-3 rounded-xl ${color}`}>
                  <Icon size={22} />
                </div>
                <span className="font-semibold text-gray-800 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-black text-[#0A1628] mb-3">Everything you need to evaluate a deal</h2>
          <p className="text-gray-500 text-lg">Built by investors who got tired of spending hours on deals that weren't worth 20 minutes.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 bg-[#E8ECF4] rounded-xl w-fit mb-4">
                <Icon size={20} className="text-[#0A1628]" />
              </div>
              <h3 className="font-bold text-[#0A1628] mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Thresholds */}
      <div className="bg-[#0A1628] text-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3">Institutional-grade thresholds, built in</h2>
            <p className="text-gray-400 text-lg">Every deal is scored against proven acquisition metrics — not gut feelings.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {THRESHOLDS.map(({ label, target, desc }) => (
              <div key={label} className="bg-[#1a2a45] rounded-xl p-5 border border-[#2a3a55]">
                <div className="text-[#B22234] font-black text-2xl mb-1">{target}</div>
                <div className="font-bold text-white mb-1">{label}</div>
                <div className="text-gray-400 text-sm">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-black text-[#0A1628] mb-3">Simple pricing</h2>
          <p className="text-gray-500 text-lg">One good deal pays for years of subscription.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { name: 'Starter', price: '$49', period: '/mo', features: ['10 deals/month', 'PDF reports', 'Location intelligence', 'Deal library'], cta: 'Get started', highlight: false },
            { name: 'Pro', price: '$149', period: '/mo', features: ['Unlimited deals', 'PDF + shareable links', 'Deal comparison', 'AI deal assistant', 'Priority support'], cta: 'Start Pro trial', highlight: true },
            { name: 'Team', price: '$349', period: '/mo', features: ['Everything in Pro', '5 team members', 'White-label reports', 'API access', 'Team deal sharing'], cta: 'Contact us', highlight: false },
          ].map(tier => (
            <div key={tier.name} className={`rounded-2xl p-7 border-2 ${tier.highlight ? 'border-[#B22234] shadow-xl relative' : 'border-gray-200'}`}>
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#B22234] text-white text-xs font-bold px-3 py-1 rounded-full">Most popular</span>
                </div>
              )}
              <div className="mb-6">
                <p className="font-bold text-gray-500 text-sm mb-1">{tier.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-[#0A1628]">{tier.price}</span>
                  <span className="text-gray-400">{tier.period}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-7">
                {tier.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={`block text-center py-3 rounded-xl font-bold transition-colors ${
                  tier.highlight
                    ? 'bg-[#B22234] hover:bg-[#8f1b2a] text-white'
                    : 'border-2 border-[#0A1628] text-[#0A1628] hover:bg-[#0A1628] hover:text-white'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#B22234] text-white py-16 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-3">Ready to evaluate your next deal?</h2>
          <p className="text-red-200 text-lg mb-8">Join investors using Deal IQ to find the signal in the noise.</p>
          <Link to="/signup" className="bg-white text-[#B22234] hover:bg-gray-100 font-bold px-8 py-4 rounded-xl text-lg transition-colors inline-block">
            Start for free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0A1628] text-gray-500 py-8 text-center text-sm">
        <p>© {new Date().getFullYear()} Deal IQ. Built by investors, for investors.</p>
      </footer>
    </div>
  )
}
