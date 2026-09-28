alter table public.evaluations
  add column if not exists aroma_note text,
  add column if not exists flavor_note text,
  add column if not exists overall_note text;

alter table public.evaluations drop constraint if exists evaluations_aroma_note_length;
alter table public.evaluations drop constraint if exists evaluations_flavor_note_length;
alter table public.evaluations drop constraint if exists evaluations_overall_note_length;

alter table public.evaluations
  add constraint evaluations_aroma_note_length check (aroma_note is null or char_length(aroma_note) <= 300),
  add constraint evaluations_flavor_note_length check (flavor_note is null or char_length(flavor_note) <= 300),
  add constraint evaluations_overall_note_length check (overall_note is null or char_length(overall_note) <= 300);

do $$
declare
  row record;
  payload jsonb;
begin
  for row in
    select id, comments
    from public.evaluations
    where comments is not null
      and aroma_note is null
      and flavor_note is null
      and overall_note is null
  loop
    if left(btrim(row.comments), 1) = '{' then
      begin
        payload := row.comments::jsonb;
        update public.evaluations
        set
          aroma_note = nullif(btrim(payload->>'aroma'), ''),
          flavor_note = nullif(btrim(payload->>'flavor'), ''),
          overall_note = nullif(btrim(payload->>'overall'), ''),
          comments = null
        where id = row.id;
      exception
        when others then
          update public.evaluations
          set overall_note = left(row.comments, 300), comments = null
          where id = row.id;
      end;
    else
      update public.evaluations
      set overall_note = left(row.comments, 300), comments = null
      where id = row.id;
    end if;
  end loop;
end $$;
