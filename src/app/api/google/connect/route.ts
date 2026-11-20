import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { requireUser } from '@/lib/server-auth'
import { authUrl } from '@/lib/google-calendar'

export const dynamic = 'force-dynamic'

// Starts Google consent. The state nonce lives in an httpOnly cookie and is checked on exchange (CSRF).
export async function POST(req: Request) {
  const auth = await requireUser(req)
  if (auth instanceof NextResponse) return auth
  try {
    const state = randomBytes(16).toString('hex')
    const res = NextResponse.json({ url: authUrl(state, `${new URL(req.url).origin}/profile`) })
    res.cookies.set('gstate', state, { httpOnly: true, sameSite: 'lax', path: '/api/google', maxAge: 600, secure: req.url.startsWith('https') })
    return res
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
