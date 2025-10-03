-- Automations core tables
create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  public_key text not null,
  encrypted_secret text not null,
  type text not null check (type in ('payment','swap','rule')),
  active boolean not null default true,

  -- payment fields
  recipient text,
  asset text,
  amount numeric(20,7),
  frequency text check (frequency in ('once','weekly','monthly','yearly')),
  next_execute_at timestamptz,

  -- swap fields
  asset_from text,
  asset_to text,
  amount_from numeric(20,7),
  condition text check (condition in ('price_increase','price_decrease','price_target')),
  condition_value numeric,
  slippage numeric default 0.02,

  -- rule fields
  rule_threshold numeric,
  rule_action text check (rule_action in ('alert','buy','sell','custom')),
  rule_amount numeric(20,7),

  -- common
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists automations_user_idx on public.automations(user_id);
create index if not exists automations_active_idx on public.automations(active);
create index if not exists automations_next_idx on public.automations(next_execute_at);

-- Execution history
create table if not exists public.automation_executions (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations(id) on delete cascade,
  executed_at timestamptz not null default now(),
  status text not null check (status in ('pending','executed','error','skipped','retrying')),
  tx_hash text,
  error text,
  metadata jsonb
);

create index if not exists automation_executions_automation_idx on public.automation_executions(automation_id);
create index if not exists automation_executions_status_idx on public.automation_executions(status);

-- RLS policies
alter table public.automations enable row level security;
alter table public.automation_executions enable row level security;

create policy "Users can view own automations" on public.automations
  for select using (auth.uid() = user_id);

create policy "Users can insert own automations" on public.automations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own automations" on public.automations
  for update using (auth.uid() = user_id);

create policy "Users can delete own automations" on public.automations
  for delete using (auth.uid() = user_id);

create policy "Users can view own automation executions" on public.automation_executions
  for select using (
    exists (
      select 1 from public.automations a
      where a.id = automation_id and a.user_id = auth.uid()
    )
  );
