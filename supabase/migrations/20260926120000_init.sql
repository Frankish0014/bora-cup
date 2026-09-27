-- Best of Rwanda Digital Cupping
-- Participant writes go through the Next.js server (service role).
-- The anon key can only read active events, sessions, and coffee lots.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  start_date date,
  end_date date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_name_not_blank check (char_length(trim(name)) > 0),
  constraint events_dates_order check (start_date is null or end_date is null or end_date >= start_date)
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete restrict,
  name text not null,
  category text not null,
  slug text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_name_not_blank check (char_length(trim(name)) > 0),
  constraint sessions_category_not_blank check (char_length(trim(category)) > 0),
  constraint sessions_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.coffee_lots (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  lot_name text not null,
  lot_number text,
  cupping_code text,
  washing_station text,
  district text,
  country text default 'Rwanda',
  variety text,
  process text,
  altitude text,
  harvest text,
  producer text,
  cooperative text,
  description text,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coffee_lots_name_not_blank check (char_length(trim(lot_name)) > 0)
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  country text not null,
  organization text,
  role text,
  created_at timestamptz not null default now(),
  constraint participants_name_not_blank check (char_length(trim(name)) > 0),
  constraint participants_country_not_blank check (char_length(trim(country)) > 0),
  constraint participants_email_format check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
);

create unique index participants_email_unique on public.participants (lower(email));

create table public.participant_sessions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'in_progress',
  resume_token uuid not null default gen_random_uuid() unique,
  constraint participant_sessions_status_check check (status in ('in_progress', 'completed')),
  constraint participant_sessions_completed_at_check check (
    (status = 'completed' and completed_at is not null)
    or (status = 'in_progress' and completed_at is null)
  )
);

create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  participant_session_id uuid not null references public.participant_sessions (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  coffee_lot_id uuid not null references public.coffee_lots (id) on delete cascade,
  aroma_score integer not null,
  flavor_score integer not null,
  overall_score integer not null,
  comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evaluations_unique_coffee unique (participant_session_id, coffee_lot_id),
  constraint evaluations_aroma_check check (aroma_score between 1 and 5),
  constraint evaluations_flavor_check check (flavor_score between 1 and 5),
  constraint evaluations_overall_check check (overall_score between 1 and 5),
  constraint evaluations_comments_length check (comments is null or char_length(comments) <= 1000)
);

create table public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create index sessions_event_id_idx on public.sessions (event_id);
create index sessions_active_idx on public.sessions (active);
create index coffee_lots_session_order_idx on public.coffee_lots (session_id, display_order);
create index coffee_lots_active_idx on public.coffee_lots (active);
create index participant_sessions_participant_idx on public.participant_sessions (participant_id);
create index participant_sessions_session_idx on public.participant_sessions (session_id);
create index participant_sessions_status_idx on public.participant_sessions (status);
create index evaluations_session_idx on public.evaluations (session_id);
create index evaluations_coffee_idx on public.evaluations (coffee_lot_id);
create index evaluations_participant_idx on public.evaluations (participant_id);
create index evaluations_updated_at_idx on public.evaluations (updated_at);
create index participants_country_idx on public.participants (country);

create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create trigger sessions_set_updated_at
before update on public.sessions
for each row execute function public.set_updated_at();

create trigger coffee_lots_set_updated_at
before update on public.coffee_lots
for each row execute function public.set_updated_at();

create trigger evaluations_set_updated_at
before update on public.evaluations
for each row execute function public.set_updated_at();

alter table public.events enable row level security;
alter table public.sessions enable row level security;
alter table public.coffee_lots enable row level security;
alter table public.participants enable row level security;
alter table public.participant_sessions enable row level security;
alter table public.evaluations enable row level security;
alter table public.admin_profiles enable row level security;

create policy "public read active events"
on public.events
for select
to anon, authenticated
using (active = true);

create policy "admins manage events"
on public.events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "public read active sessions"
on public.sessions
for select
to anon, authenticated
using (active = true);

create policy "admins manage sessions"
on public.sessions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "public read active coffees"
on public.coffee_lots
for select
to anon, authenticated
using (
  active = true
  and exists (
    select 1
    from public.sessions
    where sessions.id = coffee_lots.session_id
      and sessions.active = true
  )
);

create policy "admins manage coffees"
on public.coffee_lots
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage participants"
on public.participants
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage participant sessions"
on public.participant_sessions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage evaluations"
on public.evaluations
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "read own admin profile"
on public.admin_profiles
for select
to authenticated
using (user_id = auth.uid());

revoke all on table public.participants from anon;
revoke all on table public.participant_sessions from anon;
revoke all on table public.evaluations from anon;
revoke all on table public.admin_profiles from anon;

grant select on public.events, public.sessions, public.coffee_lots to anon, authenticated;
grant select, insert, update, delete on public.events, public.sessions, public.coffee_lots to authenticated;
grant select, insert, update, delete on public.participants, public.participant_sessions, public.evaluations to authenticated;
grant select on public.admin_profiles to authenticated;
