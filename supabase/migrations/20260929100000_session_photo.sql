alter table public.sessions
  add column if not exists photo_url text;
