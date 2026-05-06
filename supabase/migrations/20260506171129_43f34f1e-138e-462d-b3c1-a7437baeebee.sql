-- 1. Roles enum + table
create type public.app_role as enum ('admin', 'agency_owner', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users view own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid());
create policy "Admins view all roles" on public.user_roles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 2. Subscriptions
create type public.subscription_tier as enum ('free', 'starter', 'growth', 'agency');
create type public.subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'incomplete');

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  tier public.subscription_tier not null default 'free',
  status public.subscription_status not null default 'active',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users view own subscription" on public.subscriptions
  for select to authenticated using (user_id = auth.uid());
create policy "Admins view all subscriptions" on public.subscriptions
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- 3. Usage counters
create table public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid,
  metric text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, metric, period_start)
);

alter table public.usage_counters enable row level security;

create policy "Users view own usage" on public.usage_counters
  for select to authenticated using (user_id = auth.uid());

-- 4. Audit log
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id text,
  metadata jsonb default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create policy "Users view own audit" on public.audit_log
  for select to authenticated using (user_id = auth.uid());
create policy "Admins view all audit" on public.audit_log
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create index audit_log_user_idx on public.audit_log(user_id, created_at desc);

-- 5. Webhook idempotency
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  payload jsonb,
  processed_at timestamptz not null default now(),
  unique (provider, event_id)
);

alter table public.webhook_events enable row level security;
-- no policies: service role only

-- 6. Tighten existing policies: messages.UPDATE was {public}, restrict to {authenticated}
drop policy if exists "Owners can update messages" on public.messages;
create policy "Owners can update messages" on public.messages
  for update to authenticated
  using (exists (select 1 from public.clients where clients.id = messages.client_id and clients.owner_id = auth.uid()));

drop policy if exists "Owners can update missed calls" on public.missed_calls;
create policy "Owners can update missed calls" on public.missed_calls
  for update to authenticated
  using (exists (select 1 from public.clients where clients.id = missed_calls.client_id and clients.owner_id = auth.uid()));

drop policy if exists "Owners insert opt outs" on public.opt_outs;
create policy "Owners insert opt outs" on public.opt_outs
  for insert to authenticated
  with check (exists (select 1 from public.clients where clients.id = opt_outs.client_id and clients.owner_id = auth.uid()));

drop policy if exists "Owners insert scheduled" on public.scheduled_messages;
create policy "Owners insert scheduled" on public.scheduled_messages
  for insert to authenticated
  with check (exists (select 1 from public.clients where clients.id = scheduled_messages.client_id and clients.owner_id = auth.uid()));

drop policy if exists "Owners update scheduled" on public.scheduled_messages;
create policy "Owners update scheduled" on public.scheduled_messages
  for update to authenticated
  using (exists (select 1 from public.clients where clients.id = scheduled_messages.client_id and clients.owner_id = auth.uid()));

drop policy if exists "Owners delete scheduled" on public.scheduled_messages;
create policy "Owners delete scheduled" on public.scheduled_messages
  for delete to authenticated
  using (exists (select 1 from public.clients where clients.id = scheduled_messages.client_id and clients.owner_id = auth.uid()));

drop policy if exists "Users manage own push subs" on public.push_subscriptions;
create policy "Users manage own push subs" on public.push_subscriptions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 7. Auto-grant agency_owner role on signup
create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.user_roles (user_id, role) values (new.id, 'agency_owner')
  on conflict do nothing;
  insert into public.subscriptions (user_id, tier, status) values (new.id, 'free', 'active')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_role on auth.users;
create trigger on_auth_user_created_role
  after insert on auth.users
  for each row execute function public.handle_new_user_role();

-- 8. updated_at trigger for subscriptions
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();