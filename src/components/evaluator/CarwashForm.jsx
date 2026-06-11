import { useState } from 'react'
import { DollarSign, Info } from 'lucide-react'

function FieldGroup({ title, children }) {
  return (
    <div>
      <p className="section-header">{title}</p>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </div>
  )
}

function Field({ label, id, value, onChange, type = 'number', prefix, suffix, placeholder, hint }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {hint && (
          <span className="ml-1.5 text-gray-400 text-xs font-normal italic">{hint}</span>
        )}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{prefix}</span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`input-field ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-16' : ''}`}
          min={0}
          step={type === 'number' ? 'any' : undefined}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">{suffix}</span>
        )}
      </div>
    </div>
  )
}

export default function CarwashForm({ inputs, onChange }) {
  const set = (key) => (val) => onChange({ ...inputs, [key]: val === '' ? '' : Number(val) })
  const setRaw = (key) => (val) => onChange({ ...inputs, [key]: val })

  return (
    <div className="space-y-2">

      <FieldGroup title="Revenue">
        <Field label="Membership members" id="members" value={inputs.members} onChange={set('members')} placeholder="e.g. 500" hint="active paid members" />
        <Field label="Avg membership price / mo" id="mem_price" value={inputs.mem_price} onChange={set('mem_price')} prefix="$" placeholder="e.g. 30" />
        <Field label="Retail wash cars / month" id="retail_cars" value={inputs.retail_cars} onChange={set('retail_cars')} placeholder="e.g. 1500" />
        <Field label="Avg retail ticket price" id="retail_price" value={inputs.retail_price} onChange={set('retail_price')} prefix="$" placeholder="e.g. 12" />
        <Field label="Other income / month" id="other_rev" value={inputs.other_rev} onChange={set('other_rev')} prefix="$" placeholder="e.g. 500" hint="vending, detailing, etc." />
      </FieldGroup>

      <FieldGroup title="Operating Expenses (Annual)">
        <Field label="Labor" id="labor" value={inputs.labor} onChange={set('labor')} prefix="$" placeholder="e.g. 80000" />
        <Field label="Chemicals & supplies" id="chem" value={inputs.chem} onChange={set('chem')} prefix="$" placeholder="e.g. 40000" />
        <Field label="Utilities (water & electric)" id="util" value={inputs.util} onChange={set('util')} prefix="$" placeholder="e.g. 35000" />
        <Field label="Rent / property cost" id="rent" value={inputs.rent} onChange={set('rent')} prefix="$" placeholder="e.g. 36000" />
        <Field label="Maintenance & repairs" id="maint" value={inputs.maint} onChange={set('maint')} prefix="$" placeholder="e.g. 20000" />
        <Field label="Marketing" id="mktg" value={inputs.mktg} onChange={set('mktg')} prefix="$" placeholder="e.g. 12000" />
        <Field label="Insurance" id="insur" value={inputs.insur} onChange={set('insur')} prefix="$" placeholder="e.g. 8000" />
        <Field label="Other overhead" id="overhead" value={inputs.overhead} onChange={set('overhead')} prefix="$" placeholder="e.g. 15000" />
      </FieldGroup>

      <FieldGroup title="EBITDA Recast — Seller Add-backs">
        <Field label="Owner salary add-back" id="owner_sal" value={inputs.owner_sal} onChange={set('owner_sal')} prefix="$" placeholder="e.g. 60000" hint="add back if included in expenses" />
        <Field label="Personal expenses add-back" id="personal" value={inputs.personal} onChange={set('personal')} prefix="$" placeholder="e.g. 10000" hint="car, phone, travel, etc." />
        <Field label="One-time expenses add-back" id="onetime" value={inputs.onetime} onChange={set('onetime')} prefix="$" placeholder="e.g. 15000" hint="non-recurring items" />
      </FieldGroup>

      <FieldGroup title="Deal Structure">
        <Field label="Purchase price" id="price" value={inputs.price} onChange={set('price')} prefix="$" placeholder="e.g. 2800000" />
        <Field label="Down payment %" id="dp_pct" value={inputs.dp_pct} onChange={set('dp_pct')} suffix="%" placeholder="e.g. 20" hint="typically 10-30% for SBA" />
        <Field label="Interest rate" id="rate" value={inputs.rate} onChange={set('rate')} suffix="%" placeholder="e.g. 7.5" />
        <Field label="Loan term (years)" id="term" value={inputs.term} onChange={set('term')} placeholder="e.g. 10" hint="SBA 7a = up to 10 yrs" />
        <Field label="Equipment replacement reserve / yr" id="equip_res" value={inputs.equip_res} onChange={set('equip_res')} prefix="$" placeholder="e.g. 25000" />
      </FieldGroup>

      <FieldGroup title="Exit Assumptions">
        <Field label="Annual revenue growth rate" id="rgrow" value={inputs.rgrow} onChange={set('rgrow')} suffix="%" placeholder="e.g. 4" />
        <Field label="Exit EBITDA multiple (Year 5)" id="exit_mult" value={inputs.exit_mult} onChange={set('exit_mult')} suffix="x" placeholder="e.g. 6" />
      </FieldGroup>

    </div>
  )
}

export const carwashDefaults = {
  members: 500, mem_price: 30, retail_cars: 1500, retail_price: 12, other_rev: 500,
  labor: 80000, chem: 40000, util: 35000, rent: 36000, maint: 20000,
  mktg: 12000, insur: 8000, overhead: 15000,
  owner_sal: 60000, personal: 10000, onetime: 15000,
  price: 2800000, dp_pct: 20, rate: 7.5, term: 10, equip_res: 25000,
  rgrow: 4, exit_mult: 6,
}
