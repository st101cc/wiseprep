import Link from 'next/link'
import { ArrowRight, Building2, FileSearch, BookOpen, ChevronRight, TrendingUp } from 'lucide-react'
import { companies, roles, interviewFlows } from '@/lib/mock-data'
import CompanyCard from '@/components/company-card'
import InterviewFlowTimeline from '@/components/interview-flow-timeline'
import ContinuePrepBanner from '@/components/continue-prep-banner'

const quickEntries = [
  {
    icon: <FileSearch className="w-6 h-6 text-emerald-600" />,
    title: '根據 Job Description 找方向',
    desc: '貼上職缺描述，快速解析關鍵技能需求與準備重點',
    href: '/jd-analyze',
    cta: '分析 JD',
    color: 'border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50',
  },
  {
    icon: <Building2 className="w-6 h-6 text-indigo-600" />,
    title: '根據公司找方向',
    desc: '選擇目標公司，查看真實面試流程與各關卡準備要點',
    href: '/companies',
    cta: '探索公司',
    color: 'border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50',
  },
  {
    icon: <BookOpen className="w-6 h-6 text-violet-600" />,
    title: '根據職缺找方向',
    desc: '按職缺類型瀏覽技能要求、面試題型與準備 Checklist',
    href: '/roles',
    cta: '探索職缺',
    color: 'border-violet-200 hover:border-violet-300 hover:bg-violet-50',
  },
]

export default function LandingPage() {
  const featuredCompanies = companies.slice(0, 6)
  const featuredRoles = roles.slice(0, 6)
  const sampleFlow = interviewFlows.find(f => f.companySlug === 'trend-micro')!

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 py-24 px-4 border-b border-slate-100">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-600 text-sm font-medium">
            <TrendingUp className="w-4 h-4" /> 台灣科技業面試準備教練
          </div>
          <h1 className="text-5xl font-display font-bold leading-tight text-slate-900">
            知道你要面哪間，<br />
            <span className="text-indigo-600">就知道怎麼準備。</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            根據目標公司與職缺類型，取得真實面試流程、技能圖譜與準備路線圖。<br />
            不是求職平台，是個人化面試準備教練。
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Link href="/companies"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm">
              探索台灣科技公司 <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/jd-analyze"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors border border-slate-200 shadow-sm">
              分析職缺 JD
            </Link>
          </div>
        </div>
      </section>

      {/* Continue prep (only when user has targets) */}
      <ContinuePrepBanner />

      {/* Quick entries */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">選擇你的準備方式</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickEntries.map(entry => (
            <Link key={entry.title} href={entry.href}
              className={`rounded-xl border bg-white p-5 flex flex-col gap-3 transition-all group ${entry.color}`}>
              <div>{entry.icon}</div>
              <div>
                <h3 className="font-semibold text-slate-800 group-hover:text-slate-900">{entry.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{entry.desc}</p>
              </div>
              <span className="text-xs font-medium text-slate-600 flex items-center gap-1 mt-auto">
                {entry.cta} <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured companies */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-800">熱門目標公司</h2>
          <Link href="/companies" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            查看全部 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredCompanies.map(c => <CompanyCard key={c.slug} company={c} />)}
        </div>
      </section>

      {/* Featured roles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">熱門職缺準備指南</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {featuredRoles.map(role => (
            <Link key={role.slug} href={`/roles/${role.slug}`}
              className="rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-200 hover:shadow-sm transition-all text-center group">
              <div className="text-sm font-medium text-slate-800 group-hover:text-indigo-600">{role.titleZh}</div>
              <div className="text-xs text-slate-400 mt-1">{role.title}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Sample timeline */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-slate-800">面試流程長什麼樣？</h2>
          <p className="text-slate-500 text-sm mt-1">以趨勢科技 Software Engineer 為例</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <InterviewFlowTimeline flow={sampleFlow} />
        </div>
        <div className="text-center mt-6">
          <Link href="/companies/trend-micro"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
            查看完整準備指南 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-indigo-600 py-16 px-4 mt-8">
        <div className="max-w-3xl mx-auto text-center text-white space-y-4">
          <h2 className="text-3xl font-display font-bold">有面過台灣科技公司？</h2>
          <p className="text-indigo-200">匿名分享你的面試流程，幫助其他求職者更好地準備。資料越多，大家準備越精準。</p>
          <Link href="/report"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 hover:bg-indigo-50 rounded-lg font-medium transition-colors">
            匿名回報面試流程 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
