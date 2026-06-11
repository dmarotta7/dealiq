-- Run this in your Supabase SQL editor

create table deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text,
  business_type text not null,
  address text,
  asking_price numeric,
  status text default 'evaluating',
  verdict text,
  inputs jsonb,
  evaluation jsonb,
  location_data jsonb,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row level security
alter table deals enable row level security;

create policy "Users can manage their own deals"
  on deals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger deals_updated_at
  before update on deals
  for each row execute function update_updated_at();
