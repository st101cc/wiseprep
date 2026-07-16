'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { roles } from '@/lib/mock-data'
import { ChevronRight, Search, X } from 'lucide-react'
import BackButton from '@/components/back-button'

const categoryLabel: Record<string, { label: string; color: string }> = {
  engineering: { label: '工程', color: 'bg-blue-100 text-blue-700' },
  data:        { label: '資料', color: 'bg-cyan-100 text-cyan-700' },
  ai:          { label: 'AI/ML', color: 'bg-violet-100 text-violet-700' },
  product:     { label: '產品', color: 'bg-orange-100 text-orange-700' },
  design:      { label: '設計', color: 'bg-pink-100 text-pink-700' },
  hardware:    { label: '硬體', color: 'bg-slate-100 text-slate-700' },
  semiconductor:{ label: '半導體', color: 'bg-amber-100 text-amber-700' },
  security:    { label: '資安', color: 'bg-red-100 text-red-700' },
  qa:          { label: 'QA', color: 'bg-green-100 text-green-700' },
}

// Categories present in the data, in a stable order
const categories = Array.from(new Set(roles.map(r => r.category)))

export default function RolesPage() {
  const [query, setQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())

  const toggleCategory = (c: string) =>
    setSelectedCategories(prev => {
      const next = new Set(prev)
      next.has(c) ? next.delete(c) : next.add(c)
      return next
    })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return roles.filter(role => {
      if (selectedCategories.size > 0 && !selectedCategories.has(role.category)) return false
      if (!q) return true
      const haystack = [
        role.titleZh, role.title, role.description,
        ...role.requiredSkills, ...role.niceToHaveSkills,
      ].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [query, selectedCategories])

  const grouped = useMemo(
    () => filtered.reduce<Record<string, typeof roles>>((acc, role) => {
      ;(acc[role.category] ??= []).push(role)
      return acc
    }, {}),
    [filtered]
  )

  const hasFilters = query.trim() !== '' || selectedCategories.size > 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <BackButton />
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900">探索職缺類型</h1>
        <p className="text-slate-500 mt-2">選擇目標職缺，查看技能要求、面試流程與準備 Checklist</p>
      </div>

      {/* Search + filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜尋職缺名稱、技能或關鍵字…"
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {categories.map(c => {
            const cat = categoryLabel[c] ?? { label: c, color: 'bg-slate-100 text-slate-600' }
            const active = selectedCategories.has(c)
            return (
              <button key={c} onClick={() => toggleCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                }`}>
                {cat.label}
              </button>
            )
          })}
          {hasFilters && (
            <button onClick={() => { setQuery(''); setSelectedCategories(new Set()) }}
              className="text-xs text-slate-400 hover:text-slate-600 underline ml-1">
              清除全部
            </button>
          )}
        </div>

        <p className="text-sm text-slate-400">共 {filtered.length} 個職缺</p>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
            <Search className="w-6 h-6 text-slate-400" />
          </div>
          <p className="font-medium text-slate-600">找不到符合的職缺</p>
          <p className="text-sm text-slate-400 mt-1">試試其他關鍵字或調整篩選條件</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([category, categoryRoles]) => {
            const cat = categoryLabel[category] ?? { label: category, color: 'bg-slate-100 text-slate-600' }
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${cat.color}`}>{cat.label}</span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categoryRoles.map(role => (
                    <Link key={role.slug} href={`/roles/${role.slug}`}
                      className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all p-5">
                      <div className="space-y-1.5">
                        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{role.titleZh}</h3>
                        <p className="text-xs text-slate-400">{role.title}</p>
                        <p className="text-sm text-slate-500 line-clamp-2">{role.description}</p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {role.requiredSkills.slice(0, 3).map(s => (
                            <span key={s} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs rounded-md">{s}</span>
                          ))}
                          {role.requiredSkills.length > 3 && (
                            <span className="px-2 py-0.5 bg-slate-50 text-slate-400 border border-slate-100 text-xs rounded-md">+{role.requiredSkills.length - 3}</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 flex-shrink-0 mt-1 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
