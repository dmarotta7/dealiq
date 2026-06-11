function FieldGroup({ title, children }) {
  return (
    <div>
      <p className="section-header">{title}</p>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </div>
  )
}

function Field({ label, id, value, onChange, prefix, suffix, placeholder, hint }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {hint && <span className="ml-1.5 text-gray-400 text-xs font-normal italic">{hint}</span>}
      </label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{prefix}</span>}
        <input
          id={id}
          type="number"
          value={value}
          onChange={e => onChange({ [id]: e.target.value === '' ? '' : Number(e.target.value) })}
          placeholder={placeholder}
          className={`input-field ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-16' : ''}`}
          min={0}
          step="any"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">{suffix}</span>}
      </div>
    </div>
  )
}

export default function ApartmentForm({ inputs, onChange }) {
  const set = (updates) => onChange({ ...inputs, ...updates })

  return (
    <div className="space-y-2">

      <FieldGroup title="Property Info">
        <Field label="Number of units" id="units" value={inputs.units} onChange={set} placeholder="e.g. 24" />
        <Field label="Year built" id="year_built" value={inputs.year_built} onChange={set} placeholder="e.g. 1998" hint="affects reserves" />
      </FieldGroup>

      <FieldGroup title="Income (Annual)">
        <Field label="Gross potential rent" id="gpr" value={inputs.gpr} onChange={set} prefix="$" placeholder="e.g. 288000" />
        <Field label="Vacancy loss" id="vacancy" value={inputs.vacancy} onChange={set} prefix="$" placeholder="e.g. 17280" hint="typically 5-10%" />
        <Field label="Concessions" id="concessions" value={inputs.concessions} onChange={set} prefix="$" placeholder="e.g. 0" />
        <Field label="Bad debt" id="bad_debt" value={inputs.bad_debt} onChange={set} prefix="$" placeholder="e.g. 0" />
        <Field label="Other income" id="other_income" value={inputs.other_income} onChange={set} prefix="$" placeholder="e.g. 12000" hint="laundry, fees, parking" />
      </FieldGroup>

      <FieldGroup title="Operating Expenses (Annual)">
        <Field label="Property taxes" id="taxes" value={inputs.taxes} onChange={set} prefix="$" placeholder="e.g. 27000" />
        <Field label="Insurance" id="insurance" value={inputs.insurance} onChange={set} prefix="$" placeholder="e.g. 15000" />
        <Field label="Property management" id="management" value={inputs.management} onChange={set} prefix="$" placeholder="e.g. 23000" hint="typically 8-10% of EGI" />
        <Field label="Payroll / labor" id="payroll" value={inputs.payroll} onChange={set} prefix="$" placeholder="e.g. 0" />
        <Field label="Maintenance & repairs" id="maintenance" value={inputs.maintenance} onChange={set} prefix="$" placeholder="e.g. 14000" />
        <Field label="Utilities" id="utilities" value={inputs.utilities} onChange={set} prefix="$" placeholder="e.g. 20000" />
        <Field label="Other operating" id="other_opex" value={inputs.other_opex} onChange={set} prefix="$" placeholder="e.g. 5000" />
      </FieldGroup>

      <FieldGroup title="Deal Structure">
        <Field label="Purchase price" id="price" value={inputs.price} onChange={set} prefix="$" placeholder="e.g. 2300000" />
        <Field label="Down payment %" id="dp_pct" value={inputs.dp_pct} onChange={set} suffix="%" placeholder="e.g. 25" />
        <Field label="Interest rate" id="rate" value={inputs.rate} onChange={set} suffix="%" placeholder="e.g. 6.75" />
        <Field label="Loan term (years)" id="term" value={inputs.term} onChange={set} placeholder="e.g. 30" />
        <Field label="CapEx reserve / unit / yr" id="capex_per_unit" value={inputs.capex_per_unit} onChange={set} prefix="$" placeholder="e.g. 400" hint="$300-500 typical" />
      </FieldGroup>

      <FieldGroup title="Exit Assumptions">
        <Field label="Annual rent growth rate" id="rgrow" value={inputs.rgrow} onChange={set} suffix="%" placeholder="e.g. 3" />
        <Field label="Exit cap rate (Year 5)" id="exit_cap" value={inputs.exit_cap} onChange={set} suffix="%" placeholder="e.g. 6.5" />
      </FieldGroup>

    </div>
  )
}

export const apartmentDefaults = {
  units: 16, year_built: 2000,
  gpr: 257629, vacancy: 33995, concessions: 2082, bad_debt: 207, other_income: 29034,
  taxes: 27000, insurance: 15225, management: 23428, payroll: 0,
  maintenance: 14648, utilities: 40175, other_opex: 8200,
  price: 2300000, dp_pct: 25, rate: 6.75, term: 30, capex_per_unit: 400,
  rgrow: 3, exit_cap: 6.5,
}
