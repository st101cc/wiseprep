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

-- ── Token-gated read of anonymous reports (for the curator agent's daily pull) ─
-- `reports` stays unreadable to the client. The Paperclip box calls reports_feed with a secret
-- token; only the token's sha256 hash is stored here (in feed_tokens, which has RLS on and no
-- policies, so the anon key cannot read it). Create the hash on the box: sha256sum ~/.wiseprep/reports.token
create table if not exists feed_tokens (
  name       text primary key,
  token_hash text not null
);
alter table feed_tokens enable row level security;

create or replace function reports_feed(p_token text, p_since timestamptz default 'epoch')
returns setof reports
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from feed_tokens
    where name = 'reports' and token_hash = encode(sha256(convert_to(p_token, 'utf8')), 'hex')
  ) then
    raise exception 'unauthorized' using errcode = '28000';
  end if;
  return query select * from reports where submitted_at > p_since order by submitted_at limit 500;
end;
$$;

revoke all on function reports_feed(text, timestamptz) from public;
grant execute on function reports_feed(text, timestamptz) to anon;

-- then, once (hash printed by the box setup):
--   insert into feed_tokens values ('reports', '<sha256 hex>')
--   on conflict (name) do update set token_hash = excluded.token_hash;
