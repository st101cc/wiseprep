import Link from 'next/link'
import { Zap } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-semibold">WisePrep</span>
            <span className="text-slate-500 text-sm">台灣科技業面試準備教練</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/companies" className="hover:text-slate-300 transition-colors">探索公司</Link>
            <Link href="/dashboard" className="hover:text-slate-300 transition-colors">準備進度</Link>
            <Link href="/report" className="hover:text-slate-300 transition-colors">匿名回報</Link>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-slate-800 text-slate-600 text-xs">
          資料來源為社群匿名回報，僅供參考。© 2024 WisePrep MVP Prototype
        </div>
      </div>
    </footer>
  )
}
