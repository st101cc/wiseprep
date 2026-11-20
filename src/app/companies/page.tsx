'use client'

import { useState, useMemo } from 'react'
import { companies } from '@/lib/mock-data'
import CompanyCard from '@/components/company-card'
import { Search, SlidersHorizontal, X } from 'lucide-react'

const LOCATIONS = ['台北', '新竹', '台中', '台南', '桃園']
const TYPES = [
  { label: '外商', value: 'foreign' },
  { label: '新創', value: 'startup' },
  { label: '上市櫃', value: 'listed' },
  { label: '半導體', value: 'semiconductor' },
]

export default function CompaniesPage() {
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set())
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())

  const toggleLocation = (loc: string) =>
    setSelectedLocations(prev => { const s = new Set(prev); s.has(loc) ? s.delete(loc) : s.add(loc); return s })

  const toggleType = (type: string) =>
    setSelectedTypes(prev => { const s = new Set(prev); s.has(type) ? s.delete(type) : s.add(type); return s })

  const clearFilters = () => { setSelectedLocations(new Set()); setSelectedTypes(new Set()) }

  const activeFilterCount = selectedLocations.size + selectedTypes.size

  const filtered = useMemo(() => companies.filter(c => {
    if (query.trim()) {
      const q = query.toLowerCase()
      const names = [c.name, c.nameEn, c.slug, ...(c.aliases ?? [])]
      if (!names.some(n => n.toLowerCase().includes(q)) && !c.commonRoles.some(r => r.includes(q)))
        return false
    }
    if (selectedLocations.size > 0 && !c.location.some(l => selectedLocations.has(l))) return false
    if (selectedTypes.size > 0 && !selectedTypes.has(c.companyType)) return false
    return true
  }), [query, selectedLocations, selectedTypes])

  const hasActiveFilter = query.trim() || activeFilterCount > 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-900">探索台灣科技公司</h1>
        <p className="text-slate-500 mt-2">選擇目標公司，查看真實面試流程與準備指南</p>
      </div>

      {/* Search & filter bar */}
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-64 px-4 py-2.5 rounded-lg border border-slate-200 bg-white shadow-sm focus-within:border-indigo-400 transition-colors">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜尋公司名稱或職位…"
            className="flex-1 text-sm text-slate-700 placeholder-slate-400 bg-transparent outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-300 hover:text-slate-500">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
            showFilters || activeFilterCount > 0
              ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          篩選
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-5 p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">篩選條件</span>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-3 h-3" /> 清除全部
              </button>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">地區</p>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map(loc => (
                <button key={loc} onClick={() => toggleLocation(loc)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedLocations.has(loc)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}>
                  {loc}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">公司類型</p>
            <div className="flex flex-wrap gap-2">
              {TYPES.map(t => (
                <button key={t.value} onClick={() => toggleType(t.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedTypes.has(t.value)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="text-sm text-slate-500 mb-4">
        {filtered.length} 間公司
        {hasActiveFilter && filtered.length !== companies.length && `（共 ${companies.length} 間）`}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => <CompanyCard key={c.slug} company={c} />)}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400">
          <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">找不到符合條件的公司</p>
        </div>
      )}
    </div>
  )
}
