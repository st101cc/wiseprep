'use client'
import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Mail, LogOut, Save, Check, UserRound, Upload, Loader2, Sparkles, RefreshCw, CalendarDays, Unlink } from 'lucide-react'
import { pushState, syncCalendar, GCAL_FLAG } from '@/lib/cloud-state'
import BackButton from '@/components/back-button'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [background, setBackground] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [analyzedText, setAnalyzedText] = useState<string | null>(null) // CV text the current analysis was made from
  const [analyzing, setAnalyzing] = useState(false)
  const [gcal, setGcal] = useState<'unknown' | 'connected' | 'disconnected'>('unknown')
  const [gcalBusy, setGcalBusy] = useState(false)
  const [gcalMsg, setGcalMsg] = useState('')
  const exchanged = useRef(false) // Google's code is single-use; dev mode runs effects twice

  useEffect(() => {
    if (!supabase) { setReady(true); return }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session) return
    supabase.from('profiles').select('background, cv_analysis').eq('user_id', session.user.id).maybeSingle()
      .then(({ data, error }) => {
        if (error) { setMessage(`讀取失敗：${error.message}（是否已在 Supabase 執行 schema.sql？）`); return }
        setBackground(data?.background ?? '')
        setAnalysis(data?.cv_analysis ?? '')
        if (data?.cv_analysis) setAnalyzedText(data.background ?? '')
      })
  }, [session])

  const setConnected = (on: boolean) => {
    setGcal(on ? 'connected' : 'disconnected')
    try { on ? localStorage.setItem(GCAL_FLAG, '1') : localStorage.removeItem(GCAL_FLAG) } catch {}
  }

  const gcalCall = async (path: string, body?: object) => {
    const res = await fetch(path, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session!.access_token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
    return json
  }

  const synced = (r: { created: number; updated: number; deleted: number }) =>
    setGcalMsg(`已同步：新增 ${r.created}、更新 ${r.updated}、刪除 ${r.deleted} 個事件`)

  // Connection status, and finishing the Google redirect (/profile?code&state).
  useEffect(() => {
    if (!supabase || !session) return
    const q = new URLSearchParams(location.search)
    const code = q.get('code'), state = q.get('state'), denied = q.get('error')
    if (code || denied) history.replaceState(null, '', '/profile')
    if (denied) setGcalMsg('已取消 Google 授權')
    if (code && state && !exchanged.current) {
      exchanged.current = true
      setGcalBusy(true)
      gcalCall('/api/google/exchange', { code, state })
        .then(r => { setConnected(true); synced(r) })
        .catch(e => { setGcalMsg(`連結失敗：${e instanceof Error ? e.message : String(e)}`) })
        .finally(() => setGcalBusy(false))
      return
    }
    supabase.from('google_calendar').select('calendar_id').eq('user_id', session.user.id).maybeSingle()
      .then(({ data, error }) => { if (!error) setConnected(!!data) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const gcalAction = async (fn: () => Promise<void>) => {
    setGcalBusy(true); setGcalMsg('')
    try { await fn() } catch (e) { setGcalMsg(e instanceof Error ? e.message : String(e)) }
    finally { setGcalBusy(false) }
  }
  const connectGoogle = () => gcalAction(async () => {
    await pushState() // the first sync reads the account copy of your targets
    location.href = (await gcalCall('/api/google/connect')).url
  })
  const syncNow = () => gcalAction(async () => { await pushState(); synced(await syncCalendar()) })
  const disconnectGoogle = () => gcalAction(async () => {
    await gcalCall('/api/google/disconnect'); setConnected(false); setGcalMsg('已中斷連結（WisePrep 日曆與既有事件保留在 Google）')
  })

  const sendLink = async () => {
    if (!supabase || !email.trim()) return
    setMessage('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${location.origin}/profile` },
    })
    if (error) setMessage(error.message)
    else setSent(true)
  }

  const upload = async (file: File | undefined) => {
    if (!file) return
    setUploading(true); setMessage('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/parse-cv', { method: 'POST', body: form })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
      setBackground(body.text)
      setFileName(file.name)
      setStatus('idle')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e))
    } finally {
      setUploading(false)
    }
  }

  const analyze = async (text: string) => {
    if (!session) return
    setAnalyzing(true); setMessage('')
    try {
      await pushState() // so the review sees current targets
      const res = await fetch('/api/next-step', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'cv' }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
      setAnalysis(body.content)
      setAnalyzedText(text)
    } catch (e) {
      setMessage(`履歷分析失敗：${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setAnalyzing(false)
    }
  }

  const save = async () => {
    if (!supabase || !session) return
    setStatus('saving')
    const { error } = await supabase.from('profiles').upsert({ user_id: session.user.id, background })
    if (error) { setStatus('error'); setMessage(error.message); return }
    setStatus('saved'); setTimeout(() => setStatus('idle'), 1500)
    // Only re-run when the CV actually changed: the free LLM tier has a small daily quota.
    if (background.trim() && background !== analyzedText) analyze(background)
  }

  const input = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400'
  const button = 'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <BackButton />
      <div className="flex items-center gap-3">
        <UserRound className="w-7 h-7 text-indigo-600" />
        <h1 className="text-3xl font-display font-bold text-slate-900">我的檔案</h1>
      </div>

      {!supabase ? (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4">尚未設定 Supabase（.env.local），無法登入。</p>
      ) : !ready ? null : !session ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <p className="text-slate-600 text-sm">用 Email 登入（無需密碼）。我們會寄一封登入連結給你。登入後，目標、進度與薪資資料會同步到你的帳號。</p>
          {sent ? (
            <p className="text-emerald-700 text-sm flex items-center gap-1.5"><Check className="w-4 h-4" />已寄出登入連結到 {email}，請在這個瀏覽器開啟信中的連結。</p>
          ) : (
            <div className="flex gap-2">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                onKeyDown={e => e.key === 'Enter' && sendLink()} className={input} />
              <button onClick={sendLink} className={`${button} bg-indigo-600 text-white hover:bg-indigo-500 flex-shrink-0`}>
                <Mail className="w-4 h-4" />寄送登入連結
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">已登入：<span className="text-slate-800 font-medium">{session.user.email}</span></p>
            <button onClick={() => supabase?.auth.signOut()} className={`${button} border border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-500`}>
              <LogOut className="w-4 h-4" />登出
            </button>
          </div>
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">我的履歷</span>
            <label className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors ${
              uploading ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40'}`}>
              {uploading ? <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /> : <Upload className="w-6 h-6 text-indigo-500" />}
              <span className="text-sm text-slate-700">{uploading ? '讀取中…' : fileName ? `已匯入 ${fileName}，點此重新上傳` : '從電腦上傳履歷'}</span>
              <span className="text-xs text-slate-400">PDF、TXT、MD，5 MB 以內（Word 請先另存 PDF）</span>
              <input type="file" accept=".pdf,.txt,.md,application/pdf,text/plain" className="sr-only" disabled={uploading}
                onChange={e => { upload(e.target.files?.[0]); e.target.value = '' }} />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">擷取出的內容</span>
            <span className="block text-xs text-slate-400">上傳後會顯示在這裡，可直接修正或補充；按「儲存」才會存到你的帳號。AI 分析會用這段文字比對職缺要求，只有你的帳號能讀取。</span>
            <textarea value={background} onChange={e => setBackground(e.target.value)} rows={16}
              placeholder="上傳履歷後自動帶入，也可以直接貼上文字" className={input} />
          </label>
          <button onClick={save} disabled={status === 'saving'} className={`${button} bg-indigo-600 text-white hover:bg-indigo-500`}>
            {status === 'saved' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {status === 'saving' ? '儲存中…' : status === 'saved' ? '已儲存' : '儲存並分析'}
          </button>
        </div>
      )}

      {session && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              <h2 className="font-display font-semibold text-slate-900">Google 日曆</h2>
              {gcal === 'connected' && <span className="text-xs text-emerald-600 flex items-center gap-1"><Check className="w-3.5 h-3.5" />已連結</span>}
            </div>
            <div className="flex gap-2">
              {gcal === 'connected' ? (<>
                <button onClick={syncNow} disabled={gcalBusy} className={`${button} border border-indigo-200 text-indigo-600 hover:bg-indigo-50`}>
                  {gcalBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}立即同步
                </button>
                <button onClick={disconnectGoogle} disabled={gcalBusy} className={`${button} border border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-500`}>
                  <Unlink className="w-4 h-4" />中斷連結
                </button>
              </>) : gcal === 'disconnected' && (
                <button onClick={connectGoogle} disabled={gcalBusy} className={`${button} bg-indigo-600 text-white hover:bg-indigo-500`}>
                  {gcalBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}連結 Google 日曆
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500">
            會在你的 Google 帳號建立一個獨立的「WisePrep」日曆，只寫入這個日曆：每個目標的面試／下一關日期（整天），以及面試前 3 晚 20:00–21:00 的準備時段（附該關準備重點）。
            在儀表板修改日期或勾選關卡後會自動更新；WisePrep 無法讀取或修改你其他的日曆。
          </p>
          {gcalMsg && <p className={`text-sm ${/失敗|未設定|錯誤|無法/.test(gcalMsg) ? 'text-red-600' : 'text-slate-600'}`}>{gcalMsg}</p>}
        </div>
      )}

      {session && (analyzing || analysis) && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="font-display font-semibold text-slate-900">履歷分析</h2>
              {analysis && analyzedText !== null && analyzedText !== background && !analyzing && (
                <span className="text-xs text-amber-600">履歷已修改，儲存後會重新分析</span>
              )}
            </div>
            <button onClick={() => analyze(background)} disabled={analyzing || !background.trim()}
              className={`${button} border border-indigo-200 text-indigo-600 hover:bg-indigo-50`}>
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {analyzing ? '分析中…' : '重新分析'}
            </button>
          </div>
          {analyzing && !analysis && <p className="text-sm text-slate-500">正在分析你的履歷，約需 10–30 秒…</p>}
          {analysis && <div className="rounded-xl bg-white border border-slate-200 p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{analysis}</div>}
        </div>
      )}
      {message && <p className="text-sm text-red-600">{message}</p>}
    </div>
  )
}
