import { useState } from 'react'
import { Search, BookOpen, TrendingUp, Building2, DollarSign, BarChart3, Calculator, ChevronDown, ChevronUp } from 'lucide-react'

const CATEGORIES = [
  {
    id: 'profitability',
    label: 'Profitability',
    icon: TrendingUp,
    color: 'text-green-600 bg-green-50',
    terms: [
      {
        term: 'EBITDA',
        full: 'Earnings Before Interest, Taxes, Depreciation & Amortization',
        definition: 'The most common measure of a business\'s operating profitability. It strips out financing costs, taxes, and accounting adjustments to show what the business actually earns from its operations. When evaluating a small business acquisition, EBITDA is your starting point before any seller add-backs.',
        example: 'A car wash with $500K revenue and $300K in operating expenses has $200K EBITDA.',
        related: ['Recast EBITDA', 'EBITDA Margin', 'EBITDA Multiple']
      },
      {
        term: 'Recast EBITDA',
        full: 'Also called Seller\'s Discretionary Earnings (SDE)',
        definition: 'EBITDA adjusted by adding back owner-specific expenses that won\'t transfer to a new buyer. This is the true earning power of the business under new ownership. Common add-backs include owner salary, personal vehicle, personal cell phone, one-time expenses, and family member salaries.',
        example: 'If EBITDA is $200K but the owner pays himself $60K through the business and runs a personal car as a business expense ($10K), Recast EBITDA is $270K.',
        related: ['EBITDA', 'Add-backs', 'SDE']
      },
      {
        term: 'EBITDA Margin',
        full: 'EBITDA as a percentage of gross revenue',
        definition: 'Tells you what percentage of every dollar of revenue flows through to earnings. Higher margins mean the business is more efficient and profitable. For car washes, target is 25%+. For laundromats, 30%+. Thin margins leave little room for error.',
        example: '$241K EBITDA ÷ $402K revenue = 60% EBITDA margin — very strong for a car wash.',
        related: ['EBITDA', 'Gross Revenue']
      },
      {
        term: 'NOI',
        full: 'Net Operating Income',
        definition: 'The apartment building equivalent of EBITDA. Total rental income minus all operating expenses, before debt service. NOI is what you use to calculate cap rate and determine the value of an income property. It does not include mortgage payments.',
        example: '$288K gross rents - $30K vacancy - $130K expenses = $128K NOI.',
        related: ['Cap Rate', 'EGI', 'DSCR']
      },
      {
        term: 'EGI',
        full: 'Effective Gross Income',
        definition: 'For apartment buildings: the actual rental income collected after accounting for vacancy and credit losses. Gross Potential Rent minus vacancy minus concessions minus bad debt. This is what you actually deposit in the bank before paying expenses.',
        example: '$300K gross potential rent - $18K vacancy - $3K bad debt = $279K EGI.',
        related: ['NOI', 'GPR', 'Vacancy Rate']
      },
      {
        term: 'GPR',
        full: 'Gross Potential Rent',
        definition: 'The maximum rental income a property could collect if every unit were occupied and paying full market rent with no concessions. This is a theoretical ceiling — actual collections will always be lower due to vacancy and credit losses.',
        example: '24 units × $1,200/month × 12 months = $345,600 GPR.',
        related: ['EGI', 'Vacancy Rate']
      },
    ]
  },
  {
    id: 'deal_metrics',
    label: 'Deal Metrics',
    icon: Calculator,
    color: 'text-blue-600 bg-blue-50',
    terms: [
      {
        term: 'DSCR',
        full: 'Debt Service Coverage Ratio',
        definition: 'The ratio of earnings to annual debt payments. Tells you whether the business generates enough income to cover its loan payments. A DSCR of 1.0x means income exactly equals debt payments — no cushion. Lenders typically require 1.25x minimum. Below 1.0x means the business can\'t pay its own mortgage.',
        example: '$241K EBITDA ÷ $319K annual debt service = 0.76x DSCR — the business cannot cover its debt at this price.',
        related: ['Debt Service', 'NOI', 'EBITDA']
      },
      {
        term: 'CoC',
        full: 'Cash-on-Cash Return',
        definition: 'Annual cash flow divided by your total cash invested (down payment + closing costs). The most direct measure of how hard your invested dollars are working. A 15% CoC means for every $100K you put in, you get $15K back in cash per year.',
        example: '$80K year 1 cash flow ÷ $560K down payment = 14.3% cash-on-cash return.',
        related: ['IRR', 'Free Cash Flow', 'Down Payment']
      },
      {
        term: 'IRR',
        full: 'Internal Rate of Return',
        definition: 'The annualized return on your total investment over the full hold period, accounting for the timing of all cash flows including the exit sale. Unlike CoC which measures a single year, IRR captures the complete picture. Target 14%+ for apartments, 20%+ for business acquisitions.',
        example: 'If you invest $500K, receive $40K/year for 5 years, and sell for $1.2M net, your IRR is approximately 22%.',
        related: ['Equity Multiple', 'CoC', 'Exit Value']
      },
      {
        term: 'Equity Multiple',
        full: 'Total return as a multiple of invested capital',
        definition: 'Total cash received (all annual cash flows + net sale proceeds) divided by your initial equity investment. Simpler than IRR — a 2x equity multiple means you doubled your money. Target 2x+ over a 5-year hold.',
        example: '$500K invested, $200K in cash flows over 5 years, $800K net at sale = $1M total ÷ $500K = 2.0x equity multiple.',
        related: ['IRR', 'Net Proceeds']
      },
      {
        term: 'Cap Rate',
        full: 'Capitalization Rate',
        definition: 'NOI divided by purchase price. The primary valuation metric for income-producing real estate. A higher cap rate means more income relative to price — better value for the buyer. Lower cap rates indicate premium pricing. Target 6%+ for value-add multifamily.',
        example: '$128K NOI ÷ $2,000,000 purchase price = 6.4% cap rate.',
        related: ['NOI', 'Exit Cap Rate', 'GRM']
      },
      {
        term: 'GRM',
        full: 'Gross Rent Multiplier',
        definition: 'Purchase price divided by gross annual rents. A quick back-of-envelope valuation check for apartments. Lower GRM = better value. Varies significantly by market — use it as a first filter, not a final valuation.',
        example: '$2M purchase price ÷ $300K gross rents = 6.7x GRM.',
        related: ['Cap Rate', 'GPR']
      },
      {
        term: 'EBITDA Multiple',
        full: 'Purchase price as a multiple of EBITDA',
        definition: 'How many years of earnings you\'re paying for the business. The primary valuation metric for business acquisitions. For car washes: 4-6x is fair, 7-9x is premium, 10x+ is overpriced. For laundromats: 3-5x. The lower the multiple, the better the deal for the buyer.',
        example: '$2.8M asking price ÷ $241K EBITDA = 11.6x multiple — significantly above market.',
        related: ['Recast EBITDA', 'Fair Market Value']
      },
    ]
  },
  {
    id: 'financing',
    label: 'Financing',
    icon: DollarSign,
    color: 'text-purple-600 bg-purple-50',
    terms: [
      {
        term: 'SBA 7(a) Loan',
        full: 'Small Business Administration 7(a) Loan Program',
        definition: 'The most common financing tool for small business acquisitions. Government-backed loans with favorable terms — as low as 10% down, up to 10-year terms for business acquisitions, and competitive interest rates. Requires the business to show sufficient DSCR (typically 1.25x) and the buyer to have relevant experience.',
        example: 'Buying a $2M car wash with SBA financing: 10% down = $200K cash needed, $1.8M loan over 10 years.',
        related: ['DSCR', 'Down Payment', 'Debt Service']
      },
      {
        term: 'Debt Service',
        full: 'Annual loan payments (principal + interest)',
        definition: 'The total annual cost of your loan — the sum of all principal and interest payments over 12 months. This is the number you compare against EBITDA to calculate DSCR. Higher interest rates and shorter loan terms increase debt service, which tightens your cash flow.',
        example: '$2M loan at 7.5% over 10 years = $284K annual debt service.',
        related: ['DSCR', 'SBA 7(a)', 'Free Cash Flow']
      },
      {
        term: 'LTV',
        full: 'Loan-to-Value Ratio',
        definition: 'The loan amount as a percentage of the purchase price. 80% LTV means you\'re borrowing 80% and putting 20% down. Lenders use LTV to assess risk — higher LTV means more risk for the lender. SBA loans can go up to 90% LTV for qualifying acquisitions.',
        example: '$1.8M loan on a $2M purchase = 90% LTV.',
        related: ['Down Payment', 'SBA 7(a)']
      },
      {
        term: 'Seller Financing',
        full: 'Owner carry-back financing',
        definition: 'When the seller agrees to finance part of the purchase price, acting as the lender for a portion of the deal. Common in small business acquisitions — a seller carrying 10-20% of the price signals confidence in the business and reduces the buyer\'s cash needed at closing.',
        example: '$2M business: $400K down, $1.2M SBA loan, $400K seller note at 6% over 5 years.',
        related: ['Down Payment', 'SBA 7(a)']
      },
    ]
  },
  {
    id: 'operations',
    label: 'Operations & Income',
    icon: BarChart3,
    color: 'text-amber-600 bg-amber-50',
    terms: [
      {
        term: 'MRR',
        full: 'Monthly Recurring Revenue',
        definition: 'For car washes: the monthly membership revenue that comes in automatically regardless of weather or traffic. MRR is the most valuable revenue type because it\'s predictable and reduces reliance on retail traffic. A car wash with high MRR is worth more than one dependent on daily walk-in traffic.',
        example: '500 members × $30/month = $15,000 MRR — provides a stable revenue floor.',
        related: ['Membership Revenue', 'Retail Revenue']
      },
      {
        term: 'Add-backs',
        full: 'Seller\'s discretionary add-backs',
        definition: 'Expenses run through the business that benefit the owner personally and won\'t continue under new ownership. These are added back to reported EBITDA to calculate Recast EBITDA. Must be verified with documentation — aggressive or unsupported add-backs are a red flag.',
        example: 'Owner salary ($60K), personal car ($12K), family cell phones ($3K), one-time legal fee ($15K) = $90K in add-backs.',
        related: ['Recast EBITDA', 'SDE']
      },
      {
        term: 'Vacancy Rate',
        full: 'Percentage of units or time unoccupied',
        definition: 'For apartments: the percentage of potential rental income lost to empty units. A 5% vacancy rate is typical in strong markets; 10%+ warrants investigation. High vacancy can mean deferred maintenance, below-market management, or a weak rental market.',
        example: '2 empty units out of 24 total = 8.3% vacancy rate.',
        related: ['EGI', 'GPR', 'Physical Occupancy']
      },
      {
        term: 'Expense Ratio',
        full: 'Operating expenses as a percentage of EGI',
        definition: 'Total operating expenses divided by effective gross income. For apartments, a ratio above 50-55% is a red flag — it means more than half your income goes to expenses before debt service. Well-managed properties typically run 40-50%.',
        example: '$140K expenses ÷ $280K EGI = 50% expense ratio — at the high end of acceptable.',
        related: ['NOI', 'EGI', 'Operating Expenses']
      },
      {
        term: 'CapEx',
        full: 'Capital Expenditures',
        definition: 'Money spent on major repairs, replacements, and improvements that extend the life of the asset — roofs, HVAC systems, parking lots, major equipment. Unlike operating expenses, CapEx is not deducted from NOI but should be reserved for separately. Older properties require higher CapEx reserves.',
        example: '$400/unit/year × 24 units = $9,600 annual CapEx reserve for a 1990s apartment building.',
        related: ['NOI', 'Free Cash Flow', 'Operating Expenses']
      },
      {
        term: 'Physical Occupancy',
        full: 'Percentage of units physically occupied',
        definition: 'For self-storage: the percentage of rentable units actually rented. At 85%+ a storage facility is considered stabilized and lenders will provide conventional financing. Below 85% is considered lease-up and commands a lower valuation.',
        example: '85 out of 100 units rented = 85% physical occupancy — at the stabilization threshold.',
        related: ['Vacancy Rate', 'Cap Rate']
      },
    ]
  },
  {
    id: 'valuation',
    label: 'Valuation & Exit',
    icon: Building2,
    color: 'text-red-600 bg-red-50',
    terms: [
      {
        term: 'Fair Market Value',
        full: 'What the business is worth at standard market multiples',
        definition: 'The price a knowledgeable buyer would pay and a knowledgeable seller would accept in an arm\'s-length transaction. Deal IQ calculates this using standard EBITDA multiples for businesses (6x for car washes) or cap rates for real estate (6% for apartments). This is your anchor for negotiations.',
        example: '$241K EBITDA × 6x market multiple = $1.45M fair market value.',
        related: ['EBITDA Multiple', 'Cap Rate', 'Target Offer']
      },
      {
        term: 'Exit Cap Rate',
        full: 'The cap rate used to value the property at sale',
        definition: 'When projecting a future sale of an apartment building, you divide the projected Year 6 NOI by your assumed exit cap rate to get the projected sale price. A higher exit cap rate means a lower sale price — conservative underwriting assumes cap rate expansion (higher) at exit.',
        example: 'Year 6 NOI of $150K ÷ 6.5% exit cap rate = $2.31M projected sale price.',
        related: ['Cap Rate', 'IRR', 'Net Proceeds']
      },
      {
        term: 'Net Proceeds',
        full: 'Cash in your pocket after selling',
        definition: 'Gross sale price minus selling costs (typically 6% for brokers and closing costs) minus remaining loan balance. This is the actual cash you receive at closing. It\'s what gets added to your accumulated cash flows to calculate IRR and equity multiple.',
        example: '$2.3M sale price - $138K selling costs - $1.4M loan balance = $762K net proceeds.',
        related: ['IRR', 'Equity Multiple', 'Exit Cap Rate']
      },
      {
        term: 'Walk-Away Price',
        full: 'Maximum price for positive cash flow',
        definition: 'The highest price you can pay and still achieve a DSCR of 1.25x — meaning the business generates at least 25% more than its debt payments. Above this price, the deal is cash flow negative from day one. Deal IQ calculates this automatically based on your financing terms.',
        example: 'With $241K EBITDA at 7.5% interest over 10 years, the walk-away price is approximately $1.69M.',
        related: ['DSCR', 'Fair Market Value', 'Target Offer']
      },
      {
        term: 'SDE',
        full: 'Seller\'s Discretionary Earnings',
        definition: 'The same concept as Recast EBITDA, used specifically in small business brokerage. Represents the total financial benefit to a full-time owner-operator, including salary, benefits, and perks run through the business. Used interchangeably with Recast EBITDA on Deal IQ.',
        example: 'EBITDA $200K + owner salary $80K + perks $15K = $295K SDE.',
        related: ['Recast EBITDA', 'Add-backs', 'EBITDA Multiple']
      },
      {
        term: 'VPD',
        full: 'Vehicles Per Day',
        definition: 'Daily traffic count passing the location. Critical metric for car washes and laundromats — more traffic means more potential customers. Car washes typically need 15,000+ VPD for a viable express tunnel location. Deal IQ pulls this from the location intelligence engine.',
        example: '22,000 VPD on a main arterial road is a strong location for an express car wash.',
        related: ['Location Intelligence', 'MRR']
      },
    ]
  },
]

function TermCard({ term, full, definition, example, related }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-black text-[#0A1628] text-lg">{term}</span>
          <span className="text-gray-400 text-sm hidden sm:block">{full}</span>
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <p className="text-sm text-gray-400 mb-3 mt-3 sm:hidden italic">{full}</p>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">{definition}</p>
          {example && (
            <div className="bg-blue-50 rounded-lg px-4 py-3 mb-3">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Example</p>
              <p className="text-sm text-blue-800">{example}</p>
            </div>
          )}
          {related && related.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 font-medium">Related:</span>
              {related.map(r => (
                <span key={r} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{r}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Glossary() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const allTerms = CATEGORIES.flatMap(c => c.terms.map(t => ({ ...t, category: c.id })))

  const filtered = allTerms.filter(t => {
    const matchesSearch = !search ||
      t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.full.toLowerCase().includes(search.toLowerCase()) ||
      t.definition.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={22} className="text-[#0A1628]" />
          <h1 className="text-2xl font-black text-[#0A1628]">Deal IQ Glossary</h1>
        </div>
        <p className="text-gray-500">Every acronym and metric explained in plain English. Click any term to expand.</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search terms..."
          className="input-field pl-9"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap mb-8">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'all' ? 'bg-[#0A1628] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All terms ({allTerms.length})
        </button>
        {CATEGORIES.map(cat => {
          const Icon = cat.icon
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat.id ? 'bg-[#0A1628] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <Icon size={13} />
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Terms */}
      {search || activeCategory !== 'all' ? (
        <div>
          {filtered.length === 0 ? (
            <p className="text-gray-400 text-center py-12">No terms found for "{search}"</p>
          ) : (
            <div className="space-y-2">
              {filtered.map(t => <TermCard key={t.term} {...t} />)}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`p-2 rounded-lg ${cat.color}`}>
                    <Icon size={16} />
                  </div>
                  <h2 className="font-bold text-[#0A1628]">{cat.label}</h2>
                  <span className="text-xs text-gray-400">{cat.terms.length} terms</span>
                </div>
                <div className="space-y-2">
                  {cat.terms.map(t => <TermCard key={t.term} {...t} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
