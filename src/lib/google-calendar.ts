// Server-only: Google OAuth + Calendar REST via plain fetch (no googleapis dependency).
// Scope calendar.app.created: WisePrep can only touch calendars it created itself.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { buildEvents, type CalEvent, type TargetLike } from './calendar-events'
import { getCompanyBySlug, getInterviewFlow } from './mock-data'
import { FALLBACK_STAGES } from './fallback-stages'

const SCOPE = 'https://www.googleapis.com/auth/calendar.app.created'
const API = 'https://www.googleapis.com/calendar/v3'
const TZ = 'Asia/Taipei'

function env() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_TOKEN_KEY } = process.env
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_TOKEN_KEY)
    throw new Error('Google 日曆未設定：請檢查 .env.local 的 GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_TOKEN_KEY')
  const key = Buffer.from(GOOGLE_TOKEN_KEY, 'base64')
  if (key.length !== 32) throw new Error('GOOGLE_TOKEN_KEY 必須是 32 bytes 的 base64')
  return { id: GOOGLE_CLIENT_ID, secret: GOOGLE_CLIENT_SECRET, key }
}

// Refresh tokens are stored encrypted (AES-256-GCM): a leaked row is useless without the server key.
export function encrypt(text: string): string {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', env().key, iv)
  const ct = Buffer.concat([c.update(text, 'utf8'), c.final()])
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64')
}

export function decrypt(blob: string): string {
  const b = Buffer.from(blob, 'base64')
  const d = createDecipheriv('aes-256-gcm', env().key, b.subarray(0, 12))
  d.setAuthTag(b.subarray(12, 28))
  return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8')
}

export function authUrl(state: string, redirectUri: string): string {
  const q = new URLSearchParams({
    client_id: env().id, redirect_uri: redirectUri, response_type: 'code', scope: SCOPE,
    access_type: 'offline', prompt: 'consent', state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`
}

async function token(params: Record<string, string>): Promise<{ access_token: string; refresh_token?: string }> {
  const { id, secret } = env()
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: id, client_secret: secret, ...params }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(`Google 授權失敗：${body.error_description ?? body.error ?? res.status}`)
  return body
}

export const exchangeCode = (code: string, redirectUri: string) =>
  token({ grant_type: 'authorization_code', code, redirect_uri: redirectUri })

export const revoke = (refreshToken: string) =>
  fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, { method: 'POST' }).catch(() => {})

async function gcal(at: string, path: string, init: RequestInit = {}) {
  return fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${at}`, 'Content-Type': 'application/json', ...init.headers },
  })
}

/** Returns a usable WisePrep calendar id, creating the calendar if missing (e.g. the user deleted it). */
export async function ensureCalendar(at: string, calendarId?: string | null): Promise<string> {
  if (calendarId) {
    const res = await gcal(at, `/calendars/${encodeURIComponent(calendarId)}`)
    if (res.ok) return calendarId
  }
  const res = await gcal(at, '/calendars', { method: 'POST', body: JSON.stringify({ summary: 'WisePrep', timeZone: TZ }) })
  const body = await res.json()
  if (!res.ok) throw new Error(`無法建立 WisePrep 日曆：${body.error?.message ?? res.status}`)
  return body.id
}

/** Make the calendar's upcoming WisePrep events match `desired`. Past events are left alone. */
export async function syncEvents(at: string, calendarId: string, desired: CalEvent[], today: string) {
  const cal = `/calendars/${encodeURIComponent(calendarId)}/events`
  const existing = new Set<string>()
  let pageToken = ''
  do {
    const q = new URLSearchParams({ privateExtendedProperty: 'wiseprep=1', timeMin: `${today}T00:00:00+08:00`, maxResults: '250', ...(pageToken && { pageToken }) })
    const res = await gcal(at, `${cal}?${q}`)
    const body = await res.json()
    if (!res.ok) throw new Error(`讀取日曆失敗：${body.error?.message ?? res.status}`)
    for (const e of body.items ?? []) existing.add(e.id)
    pageToken = body.nextPageToken ?? ''
  } while (pageToken)

  let created = 0, updated = 0, deleted = 0
  for (const e of desired) {
    const body = JSON.stringify({ ...e, status: 'confirmed', extendedProperties: { private: { wiseprep: '1' } } })
    // Insert; a 409 means the id exists (possibly cancelled), so overwrite it instead.
    let res = existing.has(e.id) ? null : await gcal(at, cal, { method: 'POST', body })
    if (res?.ok) { created++; continue }
    if (res && res.status !== 409) throw new Error(`新增事件失敗：${(await res.json()).error?.message ?? res.status}`)
    res = await gcal(at, `${cal}/${e.id}`, { method: 'PUT', body })
    if (!res.ok) throw new Error(`更新事件失敗：${(await res.json()).error?.message ?? res.status}`)
    updated++
  }
  const want = new Set(desired.map(e => e.id))
  for (const id of Array.from(existing)) {
    if (want.has(id)) continue
    const res = await gcal(at, `${cal}/${id}`, { method: 'DELETE' })
    if (res.ok || res.status === 410) deleted++
  }
  return { created, updated, deleted }
}

const lookup = (companySlug: string, roleSlug: string) => {
  const flow = getInterviewFlow(companySlug, roleSlug)
  const company = getCompanyBySlug(companySlug)
  return { companyName: company?.name ?? companySlug, stages: flow?.stages ?? [] }
}

/** Full sync for one user: their stored token + their synced targets → WisePrep calendar. */
export async function syncForUser(sb: SupabaseClient, userId: string, origin: string, at?: string) {
  const { data: row, error } = await sb.from('google_calendar').select('refresh_token_enc, calendar_id').eq('user_id', userId).maybeSingle()
  if (error) throw new Error(`讀取日曆設定失敗：${error.message}`)
  if (!row) return null
  const access = at ?? (await token({ grant_type: 'refresh_token', refresh_token: decrypt(row.refresh_token_enc) })).access_token
  const calendarId = await ensureCalendar(access, row.calendar_id)
  if (calendarId !== row.calendar_id)
    await sb.from('google_calendar').update({ calendar_id: calendarId, updated_at: new Date().toISOString() }).eq('user_id', userId)

  const { data: profile } = await sb.from('profiles').select('state').eq('user_id', userId).maybeSingle()
  const targets = ((profile?.state as Record<string, unknown> | null)?.wiseprep_targets ?? []) as TargetLike[]
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: TZ })
  return syncEvents(access, calendarId, buildEvents(targets, today, lookup, origin, FALLBACK_STAGES), today)
}
