import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { decrypt, revoke } from '@/lib/google-calendar'

export const dynamic = 'force-dynamic'

// Revokes WisePrep's Google access and forgets the token. The WisePrep calendar itself is left in place.
export async function POST(req: Request) {
  const auth = await requireUser(req)
  if (auth instanceof NextResponse) return auth
  const { data: row } = await auth.sb.from('google_calendar').select('refresh_token_enc').eq('user_id', auth.user.id).maybeSingle()
  if (row) {
    try { await revoke(decrypt(row.refresh_token_enc)) } catch {}
    const { error } = await auth.sb.from('google_calendar').delete().eq('user_id', auth.user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ connected: false })
}
