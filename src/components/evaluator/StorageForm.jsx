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

export default function StorageForm({ inputs, onChange }) {
  const set = (updates) => onChange({ ...inputs, ...updates })

  return (
    <div className="space-y-2">

      <FieldGroup title="Facility Info">
        <Field label="Total rentable units" id="total_units" value={inputs.total_units} onChange={set} placeholder="e.g. 200" />
        <Field label="Current physical occupancy %" id="occupancy" value={inputs.occupancy} onChange={set} suffix="%" placeholder="e.g. 87" hint="85%+ = stabilized" />
        <Field label="Total rentable square feet" id="total_sqft" value={inputs.total_sqft} onChange={set} placeholder="e.g. 25000" />
        <Field label="Climate controlled units" id="climate_units" value={inputs.climate_units} onChange={set} placeholder="e.g. 60" hint="premium pricing — list separately" />
      </FieldGroup>

      <FieldGroup title="Revenue">
        <Field label="Avg rent / unit / month (standard)" id="avg_rent" value={inputs.avg_rent} onChange={set} prefix="$" placeholder="e.g. 95" />
        <Field label="Avg rent / unit / month (climate)" id="climate_rent" value={inputs.climate_rent} onChange={set} prefix="$" placeholder="e.g. 145" hint="typically 30-50% premium" />
        <Field label="Other income / month" id="other_income" value={inputs.other_income} onChange={set} prefix="$" placeholder="e.g. 800" hint="truck rental, locks, insurance" />
      </FieldGroup>

      <FieldGroup title="Operating Expenses (Annual)">
        <Field label="Property taxes" id="taxes" value={inputs.taxes} onChange={set} prefix="$" placeholder="e.g. 18000" />
        <Field label="Insurance" id="insurance" value={inputs.insurance} onChange={set} prefix="$" placeholder="e.g. 12000" />
        <Field label="Management / payroll" id="management" value={inputs.management} onChange={set} prefix="$" placeholder="e.g. 30000" hint="on-site or 3rd party mgmt" />
        <Field label="Utilities" id="utilities" value={inputs.utilities} onChange={set} prefix="$" placeholder="e.g. 15000" hint="lower for non-climate" />
        <Field label="Maintenance & repairs" id="maintenance" value={inputs.maintenance} onChange={set} prefix="$" placeholder="e.g. 8000" />
        <Field label="Marketing" id="marketing" value={inputs.marketing} onChange={set} prefix="$" placeholder="e.g. 6000" />
        <Field label="Other operating" id="other_opex" value={inputs.other_opex} onChange={set} prefix="$" placeholder="e.g. 5000" />
      </FieldGroup>

      <FieldGroup title="Deal Structure">
        <Field label="Purchase price" id="price" value={inputs.price} onChange={set} prefix="$" placeholder="e.g. 1800000" />
        <Field label="Down payment %" id="dp_pct" value={inputs.dp_pct} onChange={set} suffix="%" placeholder="e.g. 25" />
        <Field label="Interest rate" id="rate" value={inputs.rate} onChange={set} suffix="%" placeholder="e.g. 6.75" />
        <Field label="Loan term (years)" id="term" value={inputs.term} onChange={set} placeholder="e.g. 25" />
        <Field label="CapEx reserve / yr" id="capex" value={inputs.capex} onChange={set} prefix="$" placeholder="e.g. 10000" hint="roofs, doors, pavement" />
      </FieldGroup>

      <FieldGroup title="Exit Assumptions">
        <Field label="Annual rent growth rate" id="rgrow" value={inputs.rgrow} onChange={set} suffix="%" placeholder="e.g. 3" />
        <Field label="Exit cap rate (Year 5)" id="exit_cap" value={inputs.exit_cap} onChange={set} suffix="%" placeholder="e.g. 6.5" />
      </FieldGroup>

    </div>
  )
}

export const storageDefaults = {
  total_units: 200, occupancy: 87, total_sqft: 25000, climate_units: 60,
  avg_rent: 95, climate_rent: 145, other_income: 800,
  taxes: 18000, insurance: 12000, management: 30000, utilities: 15000,
  maintenance: 8000, marketing: 6000, other_opex: 5000,
  price: 1800000, dp_pct: 25, rate: 6.75, term: 25, capex: 10000,
  rgrow: 3, exit_cap: 6.5,
}
