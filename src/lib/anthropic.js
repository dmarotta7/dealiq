const ANTHROPIC_API = 'http://localhost:3001/api/claude'

function calcDS(price, dpPct, rate, term) {
  const loan = price * (1 - dpPct / 100)
  const r = rate / 100 / 12
  const n = term * 12
  if (r === 0) return loan / n * 12
  return loan * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) * 12
}

function loanBal(price, dpPct, rate, term, years) {
  const loan = price * (1 - dpPct / 100)
  const r = rate / 100 / 12
  const n = term * 12
  const p = years * 12
  if (r === 0) return loan * (1 - p / n)
  return loan * (Math.pow(1 + r, n) - Math.pow(1 + r, p)) / (Math.pow(1 + r, n) - 1)
}

function calcIRR(cfs) {
  let lo = -0.999, hi = 10, mid
  for (let i = 0; i < 300; i++) {
    mid = (lo + hi) / 2
    const pv = cfs.reduce((a, cf, t) => a + cf / Math.pow(1 + mid, t), 0)
    if (Math.abs(pv) < 0.5) break
    pv > 0 ? lo = mid : hi = mid
  }
  return mid
}

export function evaluateCarwash(inputs, address) {
  const {
    members = 0, mem_price = 0, retail_cars = 0, retail_price = 0, other_rev = 0,
    labor = 0, chem = 0, util = 0, rent = 0, maint = 0, mktg = 0, insur = 0, overhead = 0,
    owner_sal = 0, personal = 0, onetime = 0,
    price = 0, dp_pct = 20, rate = 7.5, term = 10, equip_res = 0,
    rgrow = 4, exit_mult = 6
  } = inputs

  const mem_annual = members * mem_price * 12
  const retail_annual = retail_cars * retail_price * 12
  const other_annual = other_rev * 12
  const gross_revenue = mem_annual + retail_annual + other_annual
  const total_opex = labor + chem + util + rent + maint + mktg + insur + overhead
  const reported_ebitda = gross_revenue - total_opex
  const recast_ebitda = reported_ebitda + owner_sal + personal + onetime
  const ebitda_margin = gross_revenue > 0 ? recast_ebitda / gross_revenue : 0
  const ds = calcDS(price, dp_pct, rate, term)
  const down_payment = price * dp_pct / 100
  const year1_cf = recast_ebitda - ds - equip_res
  const coc = down_payment > 0 ? year1_cf / down_payment : 0
  const dscr = ds > 0 ? recast_ebitda / ds : 0
  const ebitda_multiple = recast_ebitda > 0 ? price / recast_ebitda : 0
  const total_cars = members * 4.3 + retail_cars
  const rev_per_car = total_cars > 0 ? gross_revenue / 12 / total_cars : 0

  const projection = {}
  const years = ['year1','year2','year3','year4','year5']
  years.forEach((yr, i) => {
    const rev = gross_revenue * Math.pow(1 + rgrow / 100, i)
    const ebitda = rev * (gross_revenue > 0 ? recast_ebitda / gross_revenue : 0)
    projection[yr] = {
      revenue: Math.round(rev),
      ebitda: Math.round(ebitda),
      debt_service: Math.round(ds),
      free_cash_flow: Math.round(ebitda - ds - equip_res)
    }
  })

  const yr5_ebitda = projection.year5.ebitda
  const yr6_ebitda = yr5_ebitda * (1 + rgrow / 100)
  const gross_exit = yr5_ebitda * exit_mult
  const sell_costs = gross_exit * 0.06
  const remaining_loan = loanBal(price, dp_pct, rate, term, 5)
  const net_proceeds = gross_exit - sell_costs - remaining_loan

  const cfs = [-down_payment, ...years.map(yr => projection[yr].free_cash_flow)]
  cfs[5] += net_proceeds
  const irr = calcIRR(cfs)
  const total_received = years.reduce((a, yr) => a + projection[yr].free_cash_flow, 0) + net_proceeds
  const equity_multiple = down_payment > 0 ? (total_received + down_payment) / down_payment : 0

  const thresholds = [
    { name: 'EBITDA Margin ≥25%', actual: (ebitda_margin * 100).toFixed(1) + '%', target: '≥25%', status: ebitda_margin >= 0.25 ? 'Pass' : ebitda_margin >= 0.15 ? 'Warn' : 'Fail' },
    { name: 'Purchase Multiple ≤6x', actual: ebitda_multiple.toFixed(2) + 'x', target: '≤6x', status: ebitda_multiple <= 6 ? 'Pass' : ebitda_multiple <= 9 ? 'Warn' : 'Fail' },
    { name: 'DSCR ≥1.25x', actual: dscr.toFixed(2) + 'x', target: '≥1.25x', status: dscr >= 1.25 ? 'Pass' : dscr >= 1.0 ? 'Warn' : 'Fail' },
    { name: 'Cash-on-Cash ≥15%', actual: (coc * 100).toFixed(1) + '%', target: '≥15%', status: coc >= 0.15 ? 'Pass' : coc >= 0.08 ? 'Warn' : 'Fail' },
    { name: 'Membership MRR ≥$10K', actual: '$' + (members * mem_price).toLocaleString(), target: '≥$10K', status: members * mem_price >= 10000 ? 'Pass' : members * mem_price >= 5000 ? 'Warn' : 'Fail' },
  ]

  const passes = thresholds.filter(t => t.status === 'Pass').length
  const overall = passes >= 4 ? 'Pass' : passes >= 2 ? 'Warn' : 'Fail'

  const red_flags = []
  const strengths = []
  if (ebitda_margin < 0.20) red_flags.push(`Thin EBITDA margin of ${(ebitda_margin*100).toFixed(1)}% — industry standard is 25%+`)
  if (ebitda_multiple > 8) red_flags.push(`Purchase multiple of ${ebitda_multiple.toFixed(1)}x is above market range for this asset type`)
  if (dscr < 1.25) red_flags.push(`DSCR of ${dscr.toFixed(2)}x is below the 1.25x minimum — lenders will flag this`)
  if (members * mem_price < 5000) red_flags.push(`Low membership MRR of $${(members * mem_price).toLocaleString()} — revenue is heavily retail-dependent`)
  if (coc >= 0.15) strengths.push(`Strong cash-on-cash return of ${(coc*100).toFixed(1)}%`)
  if (dscr >= 1.25) strengths.push(`DSCR of ${dscr.toFixed(2)}x clears the 1.25x threshold`)
  if (members * mem_price >= 10000) strengths.push(`Solid membership MRR of $${(members * mem_price).toLocaleString()} provides recurring revenue stability`)
  if (ebitda_margin >= 0.25) strengths.push(`Healthy EBITDA margin of ${(ebitda_margin*100).toFixed(1)}%`)

  const recommendation = overall === 'Pass'
    ? `This deal clears key thresholds at the asking price. Verify membership retention rate and equipment age before closing.`
    : overall === 'Warn'
    ? `This deal has some merit but needs price negotiation or improved operations to clear all thresholds.`
    : `At the asking price this deal does not meet acquisition thresholds. Negotiate down or pass.`

  return {
    summary: { business_name: 'Car Wash', business_type: 'Car Wash', address, evaluation_date: new Date().toLocaleDateString() },
    revenue: { membership_mrr: members * mem_price, membership_annual: mem_annual, retail_annual, other_annual, gross_revenue, membership_pct_of_revenue: gross_revenue > 0 ? mem_annual / gross_revenue : 0 },
    expenses: { labor, chemicals: chem, utilities: util, rent, maintenance: maint, marketing: mktg, insurance: insur, other: overhead, total_opex },
    recast: { reported_ebitda, owner_salary_addback: owner_sal, personal_addback: personal, onetime_addback: onetime, recast_ebitda, ebitda_margin },
    deal: { price, down_payment, loan_amount: price * (1 - dp_pct / 100), annual_debt_service: ds, equipment_reserve: equip_res },
    metrics: { dscr, ebitda_multiple, year1_cash_flow: year1_cf, cash_on_cash: coc, revenue_per_car: rev_per_car },
    projection,
    exit: { exit_multiple_used: exit_mult, year5_ebitda: yr5_ebitda, gross_exit_value: gross_exit, selling_costs: sell_costs, remaining_loan_balance: remaining_loan, net_proceeds, irr, equity_multiple },
    verdict: { overall, score: passes * 20, thresholds, red_flags, strengths, recommendation }
  }
}

export function evaluateApartment(inputs, address) {
  const {
    units = 1, gpr = 0, vacancy = 0, concessions = 0, bad_debt = 0, other_income = 0,
    taxes = 0, insurance = 0, management = 0, payroll = 0, maintenance = 0, utilities = 0, other_opex = 0,
    price = 0, dp_pct = 25, rate = 6.75, term = 30, capex_per_unit = 400,
    rgrow = 3, exit_cap = 6.5
  } = inputs

  const net_rent = gpr - vacancy - concessions - bad_debt
  const egi = net_rent + other_income
  const total_opex = taxes + insurance + management + payroll + maintenance + utilities + other_opex
  const capex = capex_per_unit * units
  const noi = egi - total_opex
  const ds = calcDS(price, dp_pct, rate, term)
  const down_payment = price * dp_pct / 100
  const year1_cf = noi - ds - capex
  const coc = down_payment > 0 ? year1_cf / down_payment : 0
  const dscr = ds > 0 ? noi / ds : 0
  const cap_rate = price > 0 ? noi / price : 0
  const price_per_unit = units > 0 ? price / units : 0
  const grm = noi > 0 ? price / gpr : 0
  const expense_ratio = egi > 0 ? total_opex / egi : 0
  const vacancy_rate = gpr > 0 ? vacancy / gpr : 0

  const projection = {}
  const years = ['year1','year2','year3','year4','year5']
  years.forEach((yr, i) => {
    const yr_egi = egi * Math.pow(1 + rgrow / 100, i)
    const yr_opex = total_opex * Math.pow(1 + 0.02, i)
    const yr_noi = yr_egi - yr_opex
    projection[yr] = {
      egi: Math.round(yr_egi), noi: Math.round(yr_noi),
      debt_service: Math.round(ds), free_cash_flow: Math.round(yr_noi - ds - capex)
    }
  })

  const yr5_noi = projection.year5.noi
  const yr6_noi = yr5_noi * (1 + rgrow / 100)
  const gross_exit = yr6_noi / (exit_cap / 100)
  const sell_costs = gross_exit * 0.06
  const remaining_loan = loanBal(price, dp_pct, rate, term, 5)
  const net_proceeds = gross_exit - sell_costs - remaining_loan

  const cfs = [-down_payment, ...years.map(yr => projection[yr].free_cash_flow)]
  cfs[5] += net_proceeds
  const irr = calcIRR(cfs)
  const total_received = years.reduce((a, yr) => a + projection[yr].free_cash_flow, 0) + net_proceeds
  const equity_multiple = down_payment > 0 ? (total_received + down_payment) / down_payment : 0

  const thresholds = [
    { name: 'Cap Rate ≥6%', actual: (cap_rate * 100).toFixed(1) + '%', target: '≥6%', status: cap_rate >= 0.06 ? 'Pass' : cap_rate >= 0.05 ? 'Warn' : 'Fail' },
    { name: 'DSCR ≥1.25x', actual: dscr.toFixed(2) + 'x', target: '≥1.25x', status: dscr >= 1.25 ? 'Pass' : dscr >= 1.0 ? 'Warn' : 'Fail' },
    { name: 'Cash-on-Cash ≥7%', actual: (coc * 100).toFixed(1) + '%', target: '≥7%', status: coc >= 0.07 ? 'Pass' : coc >= 0 ? 'Warn' : 'Fail' },
    { name: 'IRR ≥14%', actual: (irr * 100).toFixed(1) + '%', target: '≥14%', status: irr >= 0.14 ? 'Pass' : irr >= 0.10 ? 'Warn' : 'Fail' },
    { name: 'Equity Multiple ≥2x', actual: equity_multiple.toFixed(2) + 'x', target: '≥2x', status: equity_multiple >= 2 ? 'Pass' : equity_multiple >= 1.5 ? 'Warn' : 'Fail' },
  ]

  const passes = thresholds.filter(t => t.status === 'Pass').length
  const overall = passes >= 4 ? 'Pass' : passes >= 2 ? 'Warn' : 'Fail'

  const red_flags = []
  const strengths = []
  if (cap_rate < 0.05) red_flags.push(`Cap rate of ${(cap_rate*100).toFixed(1)}% is below market — price is too high for the income`)
  if (dscr < 1.25) red_flags.push(`DSCR of ${dscr.toFixed(2)}x below 1.25x minimum`)
  if (vacancy_rate > 0.10) red_flags.push(`Vacancy rate of ${(vacancy_rate*100).toFixed(1)}% is elevated — investigate cause`)
  if (expense_ratio > 0.55) red_flags.push(`Expense ratio of ${(expense_ratio*100).toFixed(1)}% is high — target is under 50%`)
  if (cap_rate >= 0.06) strengths.push(`Cap rate of ${(cap_rate*100).toFixed(1)}% clears the 6% threshold`)
  if (dscr >= 1.25) strengths.push(`DSCR of ${dscr.toFixed(2)}x clears the 1.25x minimum`)
  if (irr >= 0.14) strengths.push(`IRR of ${(irr*100).toFixed(1)}% exceeds the 14% target`)
  if (equity_multiple >= 2) strengths.push(`Equity multiple of ${equity_multiple.toFixed(2)}x exceeds the 2x target`)

  const recommendation = overall === 'Pass'
    ? `Deal clears key thresholds. Verify rent roll and expense history before closing.`
    : overall === 'Warn'
    ? `Some thresholds missed. Negotiate on price or verify value-add opportunity exists.`
    : `Deal does not meet thresholds at asking price. Significant price reduction needed.`

  return {
    summary: { business_name: 'Apartment Building', business_type: 'Multifamily', address, evaluation_date: new Date().toLocaleDateString(), unit_count: units },
    revenue: { gpr, vacancy_loss: vacancy, concessions, bad_debt, net_rent, other_income, egi, vacancy_rate },
    expenses: { taxes, insurance, management, payroll, maintenance, utilities, other: other_opex, total_opex, expense_ratio },
    deal: { price, down_payment, loan_amount: price * (1 - dp_pct / 100), annual_debt_service: ds, capex_reserve: capex },
    metrics: { noi, cap_rate, dscr, year1_cash_flow: year1_cf, cash_on_cash: coc, price_per_unit, grm },
    projection,
    exit: { exit_cap_rate_used: exit_cap / 100, year5_noi, gross_exit_value: gross_exit, selling_costs: sell_costs, remaining_loan_balance: remaining_loan, net_proceeds, irr, equity_multiple },
    verdict: { overall, score: passes * 20, thresholds, red_flags, strengths, recommendation }
  }
}

export async function pullLocationData(address, businessType) {
  try {
    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: 'You are a commercial real estate analyst. Search for location data and return ONLY valid JSON, no markdown.',
        messages: [{ role: 'user', content: `Search for location intelligence for "${address}" for a ${businessType}. Return JSON: {"traffic_count":"string","competitor_count":0,"competitors_nearby":[],"median_household_income":0,"renter_percentage":0,"population_5mi":0,"population_growth":"string","market_context":"string","location_score":"Strong","location_score_reason":"string"}` }]
      })
    })
    const data = await response.json()
    const textBlock = data.content?.find(b => b.type === 'text')
    return JSON.parse((textBlock?.text || '{}').replace(/```json|```/g, '').trim())
  } catch {
    return { location_score: 'Unavailable', market_context: 'Location data could not be retrieved.', competitor_count: null, traffic_count: 'Unavailable' }
  }
}

export async function askDealAssistant(dealData, question, history) {
  try {
    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are Deal IQ's AI deal assistant. Be direct, honest, and reference specific numbers from this deal data: ${JSON.stringify(dealData)}`,
        messages: [...history.map(h => ({ role: h.role, content: h.content })), { role: 'user', content: question }]
      })
    })
    const data = await response.json()
    return data.content?.[0]?.text || 'Unable to process question.'
  } catch {
    return 'Error connecting to AI assistant.'
  }
}

export function evaluateLaundromat(inputs, address) {
  const {
    weekly_rev=0, vending=0,
    washers=0, dryers=0, equip_age=0, equip_value=0,
    utilities=0, rent=0, labor=0, supplies=0, maint=0, insur=0, overhead=0,
    owner_sal=0, personal=0, onetime=0,
    price=0, dp_pct=20, rate=7.5, term=10, equip_res=0,
    rgrow=3, exit_mult=5
  } = inputs

  const gross_revenue = (weekly_rev + vending) * 52
  const total_opex = utilities + rent + labor + supplies + maint + insur + overhead
  const reported_ebitda = gross_revenue - total_opex
  const recast_ebitda = reported_ebitda + owner_sal + personal + onetime
  const ebitda_margin = gross_revenue > 0 ? recast_ebitda / gross_revenue : 0
  const ds = calcDS(price, dp_pct, rate, term)
  const down_payment = price * dp_pct / 100
  const year1_cf = recast_ebitda - ds - equip_res
  const coc = down_payment > 0 ? year1_cf / down_payment : 0
  const dscr = ds > 0 ? recast_ebitda / ds : 0
  const ebitda_multiple = recast_ebitda > 0 ? price / recast_ebitda : 0
  const revenue_per_machine = (washers + dryers) > 0 ? gross_revenue / (washers + dryers) : 0
  const utility_pct = gross_revenue > 0 ? utilities / gross_revenue : 0

  const projection = {}
  ;['year1','year2','year3','year4','year5'].forEach((yr, i) => {
    const rev = gross_revenue * Math.pow(1 + rgrow / 100, i)
    const ebitda = rev * (gross_revenue > 0 ? recast_ebitda / gross_revenue : 0)
    projection[yr] = {
      revenue: Math.round(rev), ebitda: Math.round(ebitda),
      debt_service: Math.round(ds), free_cash_flow: Math.round(ebitda - ds - equip_res)
    }
  })

  const gross_exit = projection.year5.ebitda * exit_mult
  const sell_costs = gross_exit * 0.06
  const remaining_loan = loanBal(price, dp_pct, rate, term, 5)
  const net_proceeds = gross_exit - sell_costs - remaining_loan
  const cfs = [-down_payment, ...['year1','year2','year3','year4','year5'].map(yr => projection[yr].free_cash_flow)]
  cfs[5] += net_proceeds
  const irr = calcIRR(cfs)
  const total_received = ['year1','year2','year3','year4','year5'].reduce((a, yr) => a + projection[yr].free_cash_flow, 0) + net_proceeds
  const equity_multiple = down_payment > 0 ? (total_received + down_payment) / down_payment : 0

  const thresholds = [
    { name: 'EBITDA Margin ≥25%', actual: (ebitda_margin*100).toFixed(1)+'%', target: '≥25%', status: ebitda_margin>=0.25?'Pass':ebitda_margin>=0.15?'Warn':'Fail' },
    { name: 'Purchase Multiple ≤5x', actual: ebitda_multiple.toFixed(2)+'x', target: '≤5x', status: ebitda_multiple<=5?'Pass':ebitda_multiple<=7?'Warn':'Fail' },
    { name: 'DSCR ≥1.25x', actual: dscr.toFixed(2)+'x', target: '≥1.25x', status: dscr>=1.25?'Pass':dscr>=1.0?'Warn':'Fail' },
    { name: 'Cash-on-Cash ≥15%', actual: (coc*100).toFixed(1)+'%', target: '≥15%', status: coc>=0.15?'Pass':coc>=0.08?'Warn':'Fail' },
    { name: 'Equipment Age <8 yrs', actual: equip_age+'yrs', target: '<8 yrs', status: equip_age<8?'Pass':equip_age<12?'Warn':'Fail' },
  ]

  const passes = thresholds.filter(t => t.status === 'Pass').length
  const overall = passes >= 4 ? 'Pass' : passes >= 2 ? 'Warn' : 'Fail'

  const red_flags = [], strengths = []
  if (equip_age >= 8) red_flags.push(`Equipment age of ${equip_age} years — machines may need replacement soon ($${equip_value.toLocaleString()} replacement cost)`)
  if (utility_pct > 0.35) red_flags.push(`Utilities at ${(utility_pct*100).toFixed(0)}% of revenue is high — verify 12 months of actual bills`)
  if (ebitda_multiple > 6) red_flags.push(`Purchase multiple of ${ebitda_multiple.toFixed(1)}x is above the 5x laundromat benchmark`)
  if (dscr < 1.25) red_flags.push(`DSCR of ${dscr.toFixed(2)}x is below the 1.25x minimum`)
  if (labor === 0) strengths.push('Unattended operation — no labor cost improves margins significantly')
  if (equip_age < 5) strengths.push(`Equipment age of ${equip_age} years — machines are relatively new`)
  if (ebitda_margin >= 0.30) strengths.push(`Strong EBITDA margin of ${(ebitda_margin*100).toFixed(1)}%`)
  if (dscr >= 1.25) strengths.push(`DSCR of ${dscr.toFixed(2)}x clears the 1.25x threshold`)
  if (coc >= 0.15) strengths.push(`Strong cash-on-cash return of ${(coc*100).toFixed(1)}%`)

  const recommendation = overall==='Pass'
    ? 'Deal clears key thresholds. Verify utility bills and equipment service records before closing.'
    : overall==='Warn'
    ? 'Some thresholds missed. Negotiate on price or verify equipment condition and utility costs.'
    : 'Deal does not meet thresholds at asking price. Equipment age or price needs to improve.'

  return {
    summary: { business_name: 'Laundromat', business_type: 'Laundromat', address, evaluation_date: new Date().toLocaleDateString() },
    revenue: { weekly_revenue: weekly_rev + vending, annual_revenue: gross_revenue, gross_revenue },
    expenses: { utilities, rent, labor, supplies, maintenance: maint, insurance: insur, other: overhead, total_opex },
    recast: { reported_ebitda, owner_salary_addback: owner_sal, personal_addback: personal, onetime_addback: onetime, recast_ebitda, ebitda_margin },
    deal: { price, down_payment, loan_amount: price*(1-dp_pct/100), annual_debt_service: ds, equipment_reserve: equip_res },
    metrics: { dscr, ebitda_multiple, year1_cash_flow: year1_cf, cash_on_cash: coc, revenue_per_machine, utility_pct, equipment_age: equip_age },
    projection,
    exit: { exit_multiple_used: exit_mult, year5_ebitda: projection.year5.ebitda, gross_exit_value: gross_exit, selling_costs: sell_costs, remaining_loan_balance: remaining_loan, net_proceeds, irr, equity_multiple },
    verdict: { overall, score: passes*20, thresholds, red_flags, strengths, recommendation }
  }
}

export function evaluateStorage(inputs, address) {
  const {
    total_units=0, occupancy=0, total_sqft=0, climate_units=0,
    avg_rent=0, climate_rent=0, other_income=0,
    taxes=0, insurance=0, management=0, utilities=0, maintenance=0, marketing=0, other_opex=0,
    price=0, dp_pct=25, rate=6.75, term=25, capex=0,
    rgrow=3, exit_cap=6.5
  } = inputs

  const standard_units = total_units - climate_units
  const occupied_standard = Math.round(standard_units * occupancy / 100)
  const occupied_climate = Math.round(climate_units * occupancy / 100)
  const gross_potential_rent = (standard_units * avg_rent + climate_units * climate_rent) * 12
  const vacancy_loss = gross_potential_rent * (1 - occupancy / 100)
  const net_rent = gross_potential_rent - vacancy_loss
  const egi = net_rent + other_income * 12
  const total_opex = taxes + insurance + management + utilities + maintenance + marketing + other_opex
  const noi = egi - total_opex
  const cap_rate = price > 0 ? noi / price : 0
  const ds = calcDS(price, dp_pct, rate, term)
  const down_payment = price * dp_pct / 100
  const year1_cf = noi - ds - capex
  const coc = down_payment > 0 ? year1_cf / down_payment : 0
  const dscr = ds > 0 ? noi / ds : 0
  const price_per_unit = total_units > 0 ? price / total_units : 0
  const rent_per_sqft = total_sqft > 0 ? (net_rent / 12) / total_sqft : 0
  const expense_ratio = egi > 0 ? total_opex / egi : 0

  const projection = {}
  ;['year1','year2','year3','year4','year5'].forEach((yr, i) => {
    const yr_egi = egi * Math.pow(1 + rgrow / 100, i)
    const yr_opex = total_opex * Math.pow(1.02, i)
    const yr_noi = yr_egi - yr_opex
    projection[yr] = {
      egi: Math.round(yr_egi), noi: Math.round(yr_noi),
      debt_service: Math.round(ds), free_cash_flow: Math.round(yr_noi - ds - capex)
    }
  })

  const yr5_noi = projection.year5.noi
  const gross_exit = yr5_noi * (1 + rgrow / 100) / (exit_cap / 100)
  const sell_costs = gross_exit * 0.06
  const remaining_loan = loanBal(price, dp_pct, rate, term, 5)
  const net_proceeds = gross_exit - sell_costs - remaining_loan
  const cfs = [-down_payment, ...['year1','year2','year3','year4','year5'].map(yr => projection[yr].free_cash_flow)]
  cfs[5] += net_proceeds
  const irr = calcIRR(cfs)
  const total_received = ['year1','year2','year3','year4','year5'].reduce((a, yr) => a + projection[yr].free_cash_flow, 0) + net_proceeds
  const equity_multiple = down_payment > 0 ? (total_received + down_payment) / down_payment : 0

  const thresholds = [
    { name: 'Physical Occupancy ≥85%', actual: occupancy.toFixed(1)+'%', target: '≥85%', status: occupancy>=85?'Pass':occupancy>=75?'Warn':'Fail' },
    { name: 'Cap Rate ≥6%', actual: (cap_rate*100).toFixed(1)+'%', target: '≥6%', status: cap_rate>=0.06?'Pass':cap_rate>=0.05?'Warn':'Fail' },
    { name: 'DSCR ≥1.25x', actual: dscr.toFixed(2)+'x', target: '≥1.25x', status: dscr>=1.25?'Pass':dscr>=1.0?'Warn':'Fail' },
    { name: 'Cash-on-Cash ≥8%', actual: (coc*100).toFixed(1)+'%', target: '≥8%', status: coc>=0.08?'Pass':coc>=0.04?'Warn':'Fail' },
    { name: 'Expense Ratio ≤40%', actual: (expense_ratio*100).toFixed(1)+'%', target: '≤40%', status: expense_ratio<=0.40?'Pass':expense_ratio<=0.50?'Warn':'Fail' },
  ]

  const passes = thresholds.filter(t => t.status === 'Pass').length
  const overall = passes >= 4 ? 'Pass' : passes >= 2 ? 'Warn' : 'Fail'

  const red_flags = [], strengths = []
  if (occupancy < 85) red_flags.push(`Occupancy of ${occupancy}% is below the 85% stabilization threshold — lenders will require lease-up plan`)
  if (cap_rate < 0.055) red_flags.push(`Cap rate of ${(cap_rate*100).toFixed(1)}% is below market — price is too high for the income`)
  if (dscr < 1.25) red_flags.push(`DSCR of ${dscr.toFixed(2)}x is below the 1.25x minimum`)
  if (expense_ratio > 0.50) red_flags.push(`Expense ratio of ${(expense_ratio*100).toFixed(0)}% is high for self-storage — target is under 40%`)
  if (climate_units > 0) strengths.push(`${climate_units} climate-controlled units at $${climate_rent}/mo — premium pricing improves margins`)
  if (occupancy >= 85) strengths.push(`Physical occupancy of ${occupancy}% — facility is stabilized`)
  if (cap_rate >= 0.06) strengths.push(`Cap rate of ${(cap_rate*100).toFixed(1)}% clears the 6% threshold`)
  if (dscr >= 1.25) strengths.push(`DSCR of ${dscr.toFixed(2)}x clears the minimum`)
  if (expense_ratio <= 0.35) strengths.push(`Low expense ratio of ${(expense_ratio*100).toFixed(0)}% — well-managed facility`)

  const recommendation = overall==='Pass'
    ? 'Deal clears key thresholds. Verify rent rolls, lease terms, and deferred maintenance before closing.'
    : overall==='Warn'
    ? 'Some thresholds missed. Verify occupancy trend and negotiate on price.'
    : 'Deal does not meet thresholds at asking price. Occupancy or pricing needs improvement.'

  return {
    summary: { business_name: 'Self-Storage', business_type: 'Self-Storage', address, evaluation_date: new Date().toLocaleDateString(), unit_count: total_units },
    revenue: { gross_potential_rent, vacancy_loss, net_rent, other_annual: other_income*12, egi, vacancy_rate: (100-occupancy)/100 },
    expenses: { taxes, insurance, management, utilities, maintenance, marketing, other: other_opex, total_opex, expense_ratio },
    deal: { price, down_payment, loan_amount: price*(1-dp_pct/100), annual_debt_service: ds, capex_reserve: capex },
    metrics: { noi, cap_rate, dscr, year1_cash_flow: year1_cf, cash_on_cash: coc, price_per_unit, rent_per_sqft, physical_occupancy: occupancy },
    projection,
    exit: { exit_cap_rate_used: exit_cap/100, year5_noi, gross_exit_value: gross_exit, selling_costs: sell_costs, remaining_loan_balance: remaining_loan, net_proceeds, irr, equity_multiple },
    verdict: { overall, score: passes*20, thresholds, red_flags, strengths, recommendation }
  }
}

export function runEvaluation(businessType, inputs, address) {
  if (businessType === 'apartment') return Promise.resolve(evaluateApartment(inputs, address))
  if (businessType === 'laundromat') return Promise.resolve(evaluateLaundromat(inputs, address))
  if (businessType === 'storage') return Promise.resolve(evaluateStorage(inputs, address))
  return Promise.resolve(evaluateCarwash(inputs, address))
}
