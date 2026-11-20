// localStorage stays the working copy; a logged-in user's copy is mirrored to
// Supabase `profiles.state` so it follows them across browsers.
import { supabase } from './supabase'

export const SYNC_KEYS = ['wiseprep_targets', 'wiseprep_tasks_done', 'wiseprep_current_comp'] as const
const STAMP = 'wiseprep_local_updated_at'

function readLocal(): Record<string, unknown> {
  const state: Record<string, unknown> = {}
  for (const k of SYNC_KEYS) {
    try {
      const v = localStorage.getItem(k)
      if (v) state[k] = JSON.parse(v)
    } catch {}
  }
  return state
}

let timer: ReturnType<typeof setTimeout> | undefined
let targetsChanged = false

/** Set on /profile when Google Calendar is connected; target changes then re-sync the calendar. */
export const GCAL_FLAG = 'wiseprep_gcal_connected'

/** Write a synced key locally, then push to the account shortly after. */
export function saveLocal(key: (typeof SYNC_KEYS)[number], value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    localStorage.setItem(STAMP, new Date().toISOString())
  } catch {}
  if (key === 'wiseprep_targets') targetsChanged = true
  clearTimeout(timer)
  timer = setTimeout(async () => {
    try {
      await pushState()
      let connected = false
      try { connected = localStorage.getItem(GCAL_FLAG) === '1' } catch {}
      if (targetsChanged && connected) { targetsChanged = false; await syncCalendar() }
    } catch {}
  }, 1000)
}

/** Ask the server to rebuild the WisePrep Google Calendar from the account's targets. */
export async function syncCalendar(): Promise<{ created: number; updated: number; deleted: number }> {
  if (!supabase) throw new Error('Supabase 未設定')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('請先登入')
  const res = await fetch('/api/calendar/sync', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
  return body
}

export async function pushState() {
  if (!supabase) return
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  let updated_at = new Date().toISOString()
  try { updated_at = localStorage.getItem(STAMP) ?? updated_at } catch {}
  const { error } = await supabase.from('profiles').upsert({ user_id: session.user.id, state: readLocal(), updated_at })
  if (error) throw error
}

/** Pull the account copy if it is newer than this browser's. Returns true if local data was replaced. */
export async function pullState(): Promise<boolean> {
  if (!supabase) return false
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false
  const { data } = await supabase.from('profiles').select('state, updated_at').eq('user_id', session.user.id).maybeSingle()
  let localStamp: string | null = null
  try { localStamp = localStorage.getItem(STAMP) } catch {}

  const remoteNewer = data?.updated_at && Object.keys(data.state ?? {}).length > 0 &&
    (!localStamp || Date.parse(data.updated_at) > Date.parse(localStamp))
  if (remoteNewer) {
    try {
      for (const k of SYNC_KEYS) if (k in data.state) localStorage.setItem(k, JSON.stringify(data.state[k]))
      localStorage.setItem(STAMP, new Date(data.updated_at).toISOString())
    } catch {}
    return true
  }
  await pushState()
  return false
}
