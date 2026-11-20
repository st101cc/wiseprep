// Server-only: verifies the caller's Supabase access token and returns a client
// that acts as that user, so every query stays RLS-scoped to their own rows.
import { NextResponse } from 'next/server'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

export async function requireUser(req: Request): Promise<{ sb: SupabaseClient; user: User } | NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!url || !anon) return NextResponse.json({ error: 'Supabase 未設定' }, { status: 500 })
  if (!token) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const sb = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } })
  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return NextResponse.json({ error: '登入已過期，請重新登入' }, { status: 401 })
  return { sb, user }
}
