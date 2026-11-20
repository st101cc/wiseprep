import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { encrypt, exchangeCode, ensureCalendar, syncForUser } from '@/lib/google-calendar'

export const dynamic = 'force-dynamic'

// Google redirected the browser to /profile?code&state; the page posts them here with the user's token.
export async function POST(req: Request) {
  const auth = await requireUser(req)
  if (auth instanceof NextResponse) return auth
  const { code, state } = await req.json().catch(() => ({}))
  const cookie = req.headers.get('cookie')?.match(/(?:^|;\s*)gstate=([a-f0-9]+)/)?.[1]
  if (!code || !state || !cookie || state !== cookie) return NextResponse.json({ error: '授權驗證失敗，請重新連結' }, { status: 400 })

  try {
    const origin = new URL(req.url).origin
    const tok = await exchangeCode(code, `${origin}/profile`)
    if (!tok.refresh_token) return NextResponse.json({ error: 'Google 沒有回傳 refresh token，請到 Google 帳戶移除 WisePrep 的存取權後重試' }, { status: 400 })
    const calendar_id = await ensureCalendar(tok.access_token)
    const { error } = await auth.sb.from('google_calendar').upsert({
      user_id: auth.user.id, refresh_token_enc: encrypt(tok.refresh_token), calendar_id, updated_at: new Date().toISOString(),
    })
    if (error) throw new Error(`儲存失敗：${error.message}（是否已在 Supabase 執行 schema.sql？）`)
    const result = await syncForUser(auth.sb, auth.user.id, origin, tok.access_token)
    const res = NextResponse.json({ connected: true, ...result })
    res.cookies.set('gstate', '', { path: '/api/google', maxAge: 0 })
    return res
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 })
  }
}
