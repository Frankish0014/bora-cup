-- Close a table to new cuppers without deactivating the session.
-- People already on the sheet can still finish and submit.

alter table public.sessions
  add column if not exists joining_open boolean not null default true;
