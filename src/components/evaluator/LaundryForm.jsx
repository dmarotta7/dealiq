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

export default function LaundryForm({ inputs, onChange }) {
  const set = (updates) => onChange({ ...inputs, ...updates })

  return (
    <div className="space-y-2">

      <FieldGroup title="Revenue (Weekly)">
        <Field label="Avg weekly gross revenue" id="weekly_rev" value={inputs.weekly_rev} onChange={set} prefix="$" placeholder="e.g. 4500" hint="from POS system" />
        <Field label="Vending / other income / week" id="vending" value={inputs.vending} onChange={set} prefix="$" placeholder="e.g. 200" hint="snacks, soap, etc." />
      </FieldGroup>

      <FieldGroup title="Equipment">
        <Field label="Number of washers" id="washers" value={inputs.washers} onChange={set} placeholder="e.g. 20" />
        <Field label="Number of dryers" id="dryers" value={inputs.dryers} onChange={set} placeholder="e.g. 20" />
        <Field label="Avg equipment age (years)" id="equip_age" value={inputs.equip_age} onChange={set} placeholder="e.g. 6" hint="8+ years = red flag" />
        <Field label="Equipment replacement value" id="equip_value" value={inputs.equip_value} onChange={set} prefix="$" placeholder="e.g. 200000" hint="cost to replace all machines" />
      </FieldGroup>

      <FieldGroup title="Operating Expenses (Annual)">
        <Field label="Utilities (water, gas, electric)" id="utilities" value={inputs.utilities} onChange={set} prefix="$" placeholder="e.g. 60000" hint="largest expense — verify with bills" />
        <Field label="Lease / rent" id="rent" value={inputs.rent} onChange={set} prefix="$" placeholder="e.g. 36000" />
        <Field label="Labor / attendant wages" id="labor" value={inputs.labor} onChange={set} prefix="$" placeholder="e.g. 25000" hint="0 if unattended" />
        <Field label="Supplies & chemicals" id="supplies" value={inputs.supplies} onChange={set} prefix="$" placeholder="e.g. 8000" />
        <Field label="Equipment maintenance" id="maint" value={inputs.maint} onChange={set} prefix="$" placeholder="e.g. 12000" />
        <Field label="Insurance" id="insur" value={inputs.insur} onChange={set} prefix="$" placeholder="e.g. 5000" />
        <Field label="Other overhead" id="overhead" value={inputs.overhead} onChange={set} prefix="$" placeholder="e.g. 6000" />
      </FieldGroup>

      <FieldGroup title="EBITDA Recast — Seller Add-backs">
        <Field label="Owner salary add-back" id="owner_sal" value={inputs.owner_sal} onChange={set} prefix="$" placeholder="e.g. 40000" />
        <Field label="Personal expenses add-back" id="personal" value={inputs.personal} onChange={set} prefix="$" placeholder="e.g. 5000" />
        <Field label="One-time expenses add-back" id="onetime" value={inputs.onetime} onChange={set} prefix="$" placeholder="e.g. 8000" />
      </FieldGroup>

      <FieldGroup title="Deal Structure">
        <Field label="Purchase price" id="price" value={inputs.price} onChange={set} prefix="$" placeholder="e.g. 350000" />
        <Field label="Down payment %" id="dp_pct" value={inputs.dp_pct} onChange={set} suffix="%" placeholder="e.g. 20" />
        <Field label="Interest rate" id="rate" value={inputs.rate} onChange={set} suffix="%" placeholder="e.g. 7.5" />
        <Field label="Loan term (years)" id="term" value={inputs.term} onChange={set} placeholder="e.g. 10" />
        <Field label="Equipment reserve / yr" id="equip_res" value={inputs.equip_res} onChange={set} prefix="$" placeholder="e.g. 15000" hint="budget for machine replacement" />
      </FieldGroup>

      <FieldGroup title="Exit Assumptions">
        <Field label="Annual revenue growth rate" id="rgrow" value={inputs.rgrow} onChange={set} suffix="%" placeholder="e.g. 3" />
        <Field label="Exit EBITDA multiple (Year 5)" id="exit_mult" value={inputs.exit_mult} onChange={set} suffix="x" placeholder="e.g. 5" />
      </FieldGroup>

    </div>
  )
}

export const laundryDefaults = {
  weekly_rev: 4500, vending: 200,
  washers: 20, dryers: 20, equip_age: 6, equip_value: 200000,
  utilities: 60000, rent: 36000, labor: 25000, supplies: 8000,
  maint: 12000, insur: 5000, overhead: 6000,
  owner_sal: 40000, personal: 5000, onetime: 8000,
  price: 350000, dp_pct: 20, rate: 7.5, term: 10, equip_res: 15000,
  rgrow: 3, exit_mult: 5,
}
