insert into storage.buckets (id, name, public)
values ('enriched','enriched',true)
on conflict (id) do nothing;

alter table assignments add column file_url text;