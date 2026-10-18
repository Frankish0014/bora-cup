-- Additive only. Existing lots, participants, and 1–5 scores are not rewritten.

alter table public.sessions
  add column if not exists form_policy text not null default 'locked',
  add column if not exists form_type text not null default 'bora';

alter table public.sessions
  drop constraint if exists sessions_form_policy_check;
alter table public.sessions
  add constraint sessions_form_policy_check check (form_policy in ('locked', 'choice'));

alter table public.sessions
  drop constraint if exists sessions_form_type_check;
alter table public.sessions
  add constraint sessions_form_type_check check (form_type in ('bora', 'sca_traditional', 'sca_cva', 'coe', 'roastery'));

alter table public.participant_sessions
  add column if not exists form_type text not null default 'bora';

alter table public.participant_sessions
  drop constraint if exists participant_sessions_form_type_check;
alter table public.participant_sessions
  add constraint participant_sessions_form_type_check check (form_type in ('bora', 'sca_traditional', 'sca_cva', 'coe', 'roastery'));

alter table public.evaluations
  add column if not exists form_type text not null default 'bora',
  add column if not exists form_payload jsonb,
  add column if not exists total_score numeric;

alter table public.evaluations
  drop constraint if exists evaluations_form_type_check;
alter table public.evaluations
  add constraint evaluations_form_type_check check (form_type in ('bora', 'sca_traditional', 'sca_cva', 'coe', 'roastery'));

alter table public.coffee_lots
  add column if not exists province text,
  add column if not exists sector text,
  add column if not exists cell text;

create index if not exists coffee_lots_district_idx on public.coffee_lots (district);
create index if not exists coffee_lots_province_idx on public.coffee_lots (province);
create index if not exists evaluations_form_type_idx on public.evaluations (form_type);
