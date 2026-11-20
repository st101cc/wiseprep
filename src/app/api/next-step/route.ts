import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { buildPrompt, buildCvPrompt, callLLM } from '@/lib/next-step'

export const dynamic = 'force-dynamic'

// Reads the caller's own profile (RLS-scoped by their token), builds the prompt
// server-side, and calls the LLM. The API key never leaves the server.
export async function POST(req: Request) {
  const auth = await requireUser(req)
  if (auth instanceof NextResponse) return auth
  const { sb, user } = auth

  const { data: profile, error } = await sb.from('profiles').select('background, state').eq('user_id', user.id).maybeSingle()
  if (error) return NextResponse.json({ error: `讀取檔案失敗：${error.message}` }, { status: 500 })

  const { mode } = await req.json().catch(() => ({ mode: 'next' }))
  const state = (profile?.state ?? {}) as Record<string, unknown>
  const input = {
    background: profile?.background ?? '',
    targets: (state.wiseprep_targets as never) ?? [],
    currentComp: (state.wiseprep_current_comp as never) ?? null,
  }

  if (mode === 'cv' && !input.background.trim()) return NextResponse.json({ error: '請先上傳並儲存履歷' }, { status: 400 })

  try {
    if (mode === 'cv') {
      const result = await callLLM(buildCvPrompt(input))
      // Keep the latest CV review on the profile so it survives page reloads.
      await sb.from('profiles').update({ cv_analysis: result.content }).eq('user_id', user.id)
      return NextResponse.json(result)
    }
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' })
    return NextResponse.json(await callLLM(buildPrompt(input, today)))
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 })
  }
}
