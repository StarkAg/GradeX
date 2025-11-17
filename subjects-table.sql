-- Subjects table for storing subject code and titles

create table if not exists public.subjects (
  id bigserial primary key,
  code text not null unique,
  name text not null,
  source text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists subjects_code_idx on public.subjects (code);

alter table public.subjects enable row level security;

drop policy if exists "Allow read access to subjects" on public.subjects;
create policy "Allow read access to subjects"
  on public.subjects
  for select
  using (true);

