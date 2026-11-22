export type Role = 'candidate' | 'company' | 'admin'

export interface Skill {
  id: number
  name: string
}

export interface CandidateProfile {
  id: number
  headline: string
  bio: string
  education: string
  experience_years: number
  skills: Skill[]
  resume_url: string | null
  photo_url: string | null
}

export interface CompanyProfile {
  id: number
  company_name: string
  description: string
  website: string
  logo_url: string | null
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: Role
  phone: string
  city: string
  is_staff: boolean
  is_active: boolean
  date_joined: string
  candidate_profile?: CandidateProfile | null
  company_profile?: CompanyProfile | null
}

export interface Job {
  id: number
  title: string
  slug: string
  description: string
  requirements: string
  category: string
  location: string
  work_mode: string
  job_type: string
  salary_min: string | null
  salary_max: string | null
  currency: string
  skills: Skill[]
  status: 'draft' | 'published' | 'closed'
  company: number
  company_name: string
  company_logo: string | null
  application_count?: number
  has_applied?: boolean
  created_at: string
  updated_at: string
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface Application {
  id: number
  job: number
  candidate: number
  cover_letter: string
  status: 'applied' | 'under_review' | 'shortlisted' | 'rejected' | 'hired'
  candidate_name: string
  candidate_email: string
  job_title: string
  company_name: string
  created_at: string
  updated_at: string
}

export interface JobMatch {
  job: Job
  score: number
  matched_skills: string[]
}

export interface CandidateMatch {
  candidate: {
    id: number
    user: User
    headline: string
    bio: string
    education: string
    experience_years: number
    skills: Skill[]
  }
  score: number
  matched_skills: string[]
}

export interface PlatformOverview {
  totals: Record<string, number>
  applications_per_job: { job: string; company: string; total: number }[]
  applications_by_status: Record<string, number>
  applications_by_category: { category: string; label: string; count: number }[]
  top_skills: { skill: string; count: number }[]
  top_locations: { location: string; count: number }[]
  monthly_applications: { month: string; count: number }[]
}

export interface CompanyStats {
  totals: { jobs: number; published_jobs: number; applications: number }
  applications_by_status: Record<string, number>
  applications_per_job: { job: string; status: string; total: number }[]
  recent_applications: {
    id: number
    job: string
    candidate: string
    candidate_email: string
    status: string
    status_display: string
    created_at: string
  }[]
}
