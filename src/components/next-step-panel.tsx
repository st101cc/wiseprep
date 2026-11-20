'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Session } from '@supabase/supabase-js'
import { Sparkles, Loader2, LogIn } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { pushState } from '@/lib/cloud-state'
import Markdown from '@/components/markdown'

export default function NextStepPanel() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ content: string; model: string } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const analyze = async () => {
    if (!session) return
    setLoading(true); setError('')
    try {
      await pushState() // make sure the server sees the latest progress
      const res = await fetch('/api/next-step', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
      setResult(body)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h2 className="font-display font-semibold text-slate-900">AI 下一步分析</h2>
        </div>
        {session ? (
          <button onClick={analyze} disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? '分析中…' : '分析下一步'}
          </button>
        ) : (
          <Link href="/profile" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-indigo-200 text-indigo-600 hover:bg-indigo-50">
            <LogIn className="w-4 h-4" />登入以使用
          </Link>
        )}
      </div>
      <p className="text-xs text-slate-500">根據你的履歷（我的檔案）、目標職缺進度、面試日期與薪資資料，產生接下來該做的事。</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && (
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <Markdown content={result.content} />
          <p className="text-xs text-slate-400 mt-3">模型：{result.model}</p>
        </div>
      )}
    </div>
  )
}
