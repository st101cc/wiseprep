import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { syncForUser } from '@/lib/google-calendar'

export const dynamic = 'force-dynamic'

// Rebuilds the user's WisePrep calendar events from their synced targets.
export async function POST(req: Request) {
  const auth = await requireUser(req)
  if (auth instanceof NextResponse) return auth
  try {
    const result = await syncForUser(auth.sb, auth.user.id, new URL(req.url).origin)
    if (!result) return NextResponse.json({ error: '尚未連結 Google 日曆' }, { status: 404 })
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 })
  }
}
