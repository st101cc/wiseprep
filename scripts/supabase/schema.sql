-- Run this once in your Supabase project: Dashboard > SQL Editor > New query

create table if not exists reports (
  id            uuid        default gen_random_uuid() primary key,
  company_slug  text        not null,
  role_slug     text        not null,
  level         text        not null,
  interview_month text      not null,
  stages        jsonb       not null,
  offer         text,
  remote        boolean     default false,
  tips          text,
  submitted_at  timestamptz default now()
);

-- Anyone can insert (anonymous submissions). Nobody can read via the client.
alter table reports enable row level security;

create policy "allow anonymous insert"
  on reports for insert
  to anon
  with check (true);
