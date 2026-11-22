export type Role = 'candidate' | 'company' | 'admin'

export interface Skill {
  id: number
  name: string
}

export interface ExperienceEntry {
  id: number
  role: string
  company: string
  start: string
  end: string
  is_current: boolean
  description: string
}

export interface EducationEntry {
  id: number
  course: string
  institution: string
  status: 'in_progress' | 'completed' | 'dropped'
  year: number | null
}

export interface CandidateProfile {
  id: number
  headline: string
  bio: string
  education: string
  experience_years: number
  skills: Skill[]
  preferred_category: string
  preferred_work_modes: string[]
  preferred_location: string
  experiences: ExperienceEntry[]
  educations: EducationEntry[]
  resume_url: string | null
  photo_url: string | null
}

export interface CompanyProfile {
  id: number
  company_name: string
  legal_name: string
  trade_name: string
  cnpj: string
  sector: string
  size: string
  state: string
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

export type JobStatus = 'draft' | 'published' | 'paused'
export type ApplicationStatus =
  | 'applied'
  | 'under_review'
  | 'interview'
  | 'rejected'
  | 'hired'

export interface Job {
  id: number
  title: string
  slug: string
  description: string
  requirements: string
  responsibilities: string
  category: string
  location: string
  work_mode: string
  job_type: string
  seniority: string
  contract_type: string
  salary_min: string | null
  salary_max: string | null
  currency: string
  essential_skills: Skill[]
  desired_skills: Skill[]
  skills: Skill[]
  status: JobStatus
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

export interface StatusHistoryEntry {
  id: number
  from_status: string
  to_status: string
  status_display: string
  created_at: string
}

export interface Application {
  id: number
  job: number
  candidate: number
  cover_letter: string
  status: ApplicationStatus
  status_display: string
  candidate_name: string
  candidate_email: string
  job_title: string
  company_name: string
  status_history: StatusHistoryEntry[]
  created_at: string
  updated_at: string
}

export interface MatchCriteria {
  score: number
  max: number
  matched?: string[]
  partial?: string[]
  missing?: string[]
  years_fit?: number
  text_similarity?: number
  experience_years?: number
  seniority?: string
  location?: number
  work_mode?: number
  category?: number
}

export interface MatchBreakdown {
  score: number
  matched_skills: string[]
  criteria: {
    essential: MatchCriteria
    desired: MatchCriteria
    experience: MatchCriteria
    preferences: MatchCriteria
  }
}

export interface JobMatch extends MatchBreakdown {
  job: Job
}

export interface CandidateMatch extends MatchBreakdown {
  candidate: {
    id: number
    user: User
    headline: string
    bio: string
    education: string
    experience_years: number
    preferred_category: string
    preferred_work_modes: string[]
    preferred_location: string
    city: string
    skills: Skill[]
    experiences: ExperienceEntry[]
    educations: EducationEntry[]
  }
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
