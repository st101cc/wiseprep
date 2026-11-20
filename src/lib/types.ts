export type Industry = 'software' | 'semiconductor' | 'ecommerce' | 'fintech' | 'ai' | 'hardware' | 'consulting'
export type CompanyType = 'foreign' | 'startup' | 'listed' | 'semiconductor'
export type RoleCategory = 'engineering' | 'data' | 'ai' | 'product' | 'design' | 'semiconductor' | 'hardware' | 'security' | 'qa'
export type InterviewFormat = 'phone' | 'video' | 'onsite' | 'async' | 'test'
export type Difficulty = 1 | 2 | 3 | 4 | 5

export interface Company {
  slug: string
  name: string
  nameEn: string
  industry: Industry
  companyType: CompanyType
  location: string[]
  commonRoles: string[]
  interviewDataCount: number
  lastUpdated: string
  hasUserReports: boolean
  // Sourced from Wikidata by the scraper (scripts/scrape). Optional: companies
  // that fall back to seed-only data may not have these.
  website?: string | null
  founded?: number | null
  wikidataId?: string | null
}

export interface Role {
  slug: string
  title: string
  titleZh: string
  category: RoleCategory
  description: string
  requiredSkills: string[]
  niceToHaveSkills: string[]
}

export interface InterviewStage {
  order: number
  name: string
  nameZh: string
  estimatedDuration: string
  format: InterviewFormat
  difficulty: Difficulty
  questionTypes: string[]
  prepTips: string[]
  interviewerRole: string
}

export interface InterviewFlow {
  id: string
  companySlug: string
  roleSlug: string
  stages: InterviewStage[]
  source: {
    count: number
    hasUserReports: boolean
    isInferred: boolean
    lastUpdated: string
    confidenceScore: number
    references?: { title: string; url: string }[]
  }
  compensation?: Compensation
}

export interface Compensation {
  currency: 'TWD'
  marketBand: { p25: number; p50: number; p75: number; p90: number; label: string } // annual total comp
  targetBand: { low: number; high: number; note: string } // our estimate, not published by the company
  structure: string[]
  askRecruiter: string[]
  sources: { title: string; url: string }[]
  lastUpdated: string
}
