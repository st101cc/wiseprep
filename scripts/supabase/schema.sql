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

-- ── Personal profile + synced app state (one row per logged-in user) ──────────
-- ponytail: whole client state as one jsonb blob; split into tables if you ever need to query targets server-side.
create table if not exists profiles (
  user_id     uuid        primary key references auth.users on delete cascade,
  background  text        not null default '',
  state       jsonb       not null default '{}'::jsonb,
  cv_analysis text        not null default '',
  updated_at  timestamptz not null default now()
);

-- for projects that created profiles before cv_analysis existed
alter table profiles add column if not exists cv_analysis text not null default '';

alter table profiles enable row level security;

create policy "own profile: select" on profiles for select to authenticated using (auth.uid() = user_id);
create policy "own profile: insert" on profiles for insert to authenticated with check (auth.uid() = user_id);
create policy "own profile: update" on profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Google Calendar link (one row per user) ──────────────────────────────────
-- refresh_token_enc is AES-256-GCM ciphertext (key GOOGLE_TOKEN_KEY, server-only),
-- so even the owner's client read only ever sees ciphertext.
create table if not exists google_calendar (
  user_id           uuid        primary key references auth.users on delete cascade,
  refresh_token_enc text        not null,
  calendar_id       text,
  updated_at        timestamptz not null default now()
);

alter table google_calendar enable row level security;

create policy "own gcal: select" on google_calendar for select to authenticated using (auth.uid() = user_id);
create policy "own gcal: insert" on google_calendar for insert to authenticated with check (auth.uid() = user_id);
create policy "own gcal: update" on google_calendar for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own gcal: delete" on google_calendar for delete to authenticated using (auth.uid() = user_id);
