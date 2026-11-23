import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CheckCircle2, X } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Job, Paginated } from '../types'
import { Header, type LandingNavTab } from '../components/landing/Header'
import { HeroSection } from '../components/landing/HeroSection'
import { TrustBar } from '../components/landing/TrustBar'
import { FeaturedJobs } from '../components/landing/FeaturedJobs'
import { LandingFooter } from '../components/landing/LandingFooter'
import type { LandingJobItem } from '../components/landing/LandingJobCard'

const SAMPLE_SHOWCASE_JOBS: LandingJobItem[] = [
  {
    id: 'sample-appliety-intern',
    title: 'Software Engineer Intern',
    companyName: 'Appliety',
    location: 'São Paulo, SP',
    contractType: 'Internship',
    workMode: 'Remote option',
    isSample: true,
    verified: true,
  },
  {
    id: 'sample-google-frontend',
    title: 'Frontend Developer Junior',
    companyName: 'Google',
    location: 'São Paulo, SP',
    contractType: 'Full-time',
    workMode: 'Hybrid',
    isSample: true,
    verified: true,
  },
  {
    id: 'sample-microsoft-fullstack',
    title: 'Full Stack Developer',
    companyName: 'Microsoft',
    location: 'São Paulo, SP',
    contractType: 'Full-time',
    workMode: 'Remote',
    isSample: true,
    verified: true,
  },
  {
    id: 'sample-amazon-backend',
    title: 'Backend Developer',
    companyName: 'Amazon',
    location: 'São Paulo, SP',
    contractType: 'Full-time',
    workMode: 'Remote',
    isSample: true,
    verified: true,
  },
]

const CONTRACT_MAP: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  internship: 'Internship',
  freelance: 'Freelance',
}

const MODE_MAP: Record<string, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
}

function mapApiJob(job: Job): LandingJobItem {
  return {
    id: job.id,
    realJobId: job.id,
    title: job.title,
    companyName: job.company_name,
    companyLogoUrl: job.company_logo,
    location: job.location || 'Brazil',
    contractType: CONTRACT_MAP[job.job_type] ?? job.job_type,
    workMode: MODE_MAP[job.work_mode] ?? job.work_mode,
    isSample: false,
    verified: true,
  }
}

const LOCAL_SAVED_KEY = 'appliety_landing_saved_ids'
const LOCAL_ALERT_KEY = 'appliety_landing_alert_draft'

export function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [liveJobs, setLiveJobs] = useState<LandingJobItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<LandingNavTab>('jobs')
  const [activeCompany, setActiveCompany] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_SAVED_KEY)
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
    } catch {
      return new Set()
    }
  })
  const [savingId, setSavingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [previewJob, setPreviewJob] = useState<LandingJobItem | null>(null)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [alertKeyword, setAlertKeyword] = useState('')
  const [alertEmail, setAlertEmail] = useState('')
  const [alertSaved, setAlertSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .get<Paginated<Job>>('/jobs/', { params: { page_size: 4 } })
      .then(({ data }) => {
        if (cancelled) return
        const mapped = (data.results ?? []).map(mapApiJob)
        setLiveJobs(mapped)
        const serverSaved = (data.results ?? [])
          .filter((j) => j.is_saved)
          .map((j) => String(j.id))
        if (serverSaved.length > 0) {
          setSavedIds((prev) => new Set([...prev, ...serverSaved]))
        }
      })
      .catch(() => {
        if (!cancelled) setLiveJobs([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(t)
  }, [toast])

  const persistLocalSaved = (next: Set<string>) => {
    try {
      localStorage.setItem(LOCAL_SAVED_KEY, JSON.stringify([...next]))
    } catch {
      /* ignore storage failures */
    }
  }

  // Show live published DB vacancies first; fill remaining featured slots with official showcase cards
  const { combinedJobs, hasSampleFallback } = useMemo(() => {
    if (liveJobs.length >= 4) {
      return { combinedJobs: liveJobs.slice(0, 4), hasSampleFallback: false }
    }
    const needed = 4 - liveJobs.length
    return {
      combinedJobs: [...liveJobs, ...SAMPLE_SHOWCASE_JOBS.slice(0, needed)],
      hasSampleFallback: true,
    }
  }, [liveJobs])

  const displayedJobs = useMemo(() => {
    let list = combinedJobs
    if (activeTab === 'saved') {
      list = list.filter((j) => savedIds.has(String(j.id)))
    }
    if (activeCompany) {
      list = list.filter(
        (j) => j.companyName.toLowerCase() === activeCompany.toLowerCase(),
      )
    }
    return list
  }, [combinedJobs, activeTab, activeCompany, savedIds])

  const handleSearch = (query: string, location: string) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (location === 'Remote') {
      params.set('work_mode', 'remote')
    } else if (location) {
      params.set('location', location)
    }
    const qs = params.toString()
    navigate(qs ? `/jobs?${qs}` : '/jobs')
  }

  const handleFocusSearch = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.setTimeout(() => {
      searchInputRef.current?.focus()
    }, 220)
  }

  const handleSelectTab = (tab: LandingNavTab) => {
    if (tab === 'alerts') {
      setAlertsOpen(true)
      return
    }
    setActiveTab(tab)
    if (tab === 'companies') {
      document.getElementById('trusted-companies')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    if (tab === 'saved') {
      document.getElementById('featured-jobs')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    setActiveCompany(null)
    document.getElementById('featured-jobs')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSelectCompany = (companyName: string) => {
    setActiveTab('companies')
    setActiveCompany((prev) => (prev === companyName ? null : companyName))
    document.getElementById('featured-jobs')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleToggleSave = async (job: LandingJobItem) => {
    const key = String(job.id)
    if (job.realJobId && user) {
      setSavingId(key)
      try {
        const { data } = await api.post<{ saved: boolean }>('/saved-jobs/', {
          job: job.realJobId,
        })
        setSavedIds((prev) => {
          const next = new Set(prev)
          if (data.saved) next.add(key)
          else next.delete(key)
          persistLocalSaved(next)
          return next
        })
        setToast(data.saved ? `"${job.title}" saved to your account.` : 'Removed from saved jobs.')
      } catch {
        setToast('Could not update saved job right now.')
      } finally {
        setSavingId(null)
      }
      return
    }

    setSavedIds((prev) => {
      const next = new Set(prev)
      const nowSaved = !next.has(key)
      if (nowSaved) next.add(key)
      else next.delete(key)
      persistLocalSaved(next)
      setToast(
        nowSaved
          ? `"${job.title}" bookmarked in this browser. Sign in to sync saved jobs.`
          : 'Bookmark removed.',
      )
      return next
    })
  }

  const handleApply = (job: LandingJobItem) => {
    if (job.realJobId) {
      navigate(`/jobs/${job.realJobId}`)
      return
    }
    setPreviewJob(job)
  }

  const handleSaveAlertDraft = (e: FormEvent) => {
    e.preventDefault()
    if (!alertKeyword.trim() || !alertEmail.trim()) return
    try {
      localStorage.setItem(
        LOCAL_ALERT_KEY,
        JSON.stringify({ keyword: alertKeyword.trim(), email: alertEmail.trim() }),
      )
    } catch {
      /* ignore */
    }
    setAlertSaved(true)
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#101828]">
      <Header
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onFocusSearch={handleFocusSearch}
        savedCount={savedIds.size}
      />

      <main className="flex-1">
        <HeroSection searchInputRef={searchInputRef} onSearch={handleSearch} />
        <TrustBar onSelectCompany={handleSelectCompany} activeCompany={activeCompany} />
        <FeaturedJobs
          jobs={displayedJobs}
          loading={loading}
          showingSavedOnly={activeTab === 'saved'}
          activeCompany={activeCompany}
          hasSampleFallback={hasSampleFallback}
          savedIds={savedIds}
          savingId={savingId}
          onToggleSave={handleToggleSave}
          onApply={handleApply}
          onResetFilters={() => {
            setActiveTab('jobs')
            setActiveCompany(null)
          }}
        />
      </main>

      <LandingFooter />

      {/* Lightweight feedback toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-[#D4E3FC] bg-[#10213D] px-4 py-3 text-sm font-medium text-white shadow-xl"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#7DA8FF]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Preview role detail modal for featured showcase cards */}
      {previewJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#10213D]/45 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-job-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#0756D7]">
                  Featured Preview Listing
                </p>
                <h3 id="preview-job-title" className="mt-1 text-xl font-bold text-[#101828]">
                  {previewJob.title}
                </h3>
                <p className="text-sm font-medium text-[#596780]">
                  {previewJob.companyName} · {previewJob.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewJob(null)}
                className="rounded-lg p-1.5 text-[#596780] hover:bg-[#F7F9FD] hover:text-[#101828]"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-4 rounded-xl border border-[#E2E8F0] bg-[#F7F9FD] p-3.5 text-sm leading-relaxed text-[#596780]">
              This is a showcase preview listing ({previewJob.contractType} · {previewJob.workMode}).
              Explore open positions published by employers on Appliety or create a candidate profile
              to apply directly.
            </p>

            <div className="mt-5 flex flex-wrap justify-end gap-2.5">
              <Link
                to={`/jobs?q=${encodeURIComponent(previewJob.title)}`}
                onClick={() => setPreviewJob(null)}
                className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#101828] hover:bg-[#F7F9FD]"
              >
                Search live roles
              </Link>
              <Link
                to={user ? '/jobs' : '/register?role=candidate'}
                onClick={() => setPreviewJob(null)}
                className="rounded-xl bg-[#0756D7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B55B9]"
              >
                {user ? 'Open Jobs Directory' : 'Create candidate account'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Honest Job Alerts preview modal */}
      {alertsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#10213D]/45 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="alerts-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#0756D7]">
                  <Bell className="h-5 w-5" />
                </span>
                <div>
                  <h3 id="alerts-modal-title" className="text-lg font-bold text-[#101828]">
                    Job Alerts
                  </h3>
                  <p className="text-xs text-[#596780]">
                    Save a role preference before creating your account
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAlertsOpen(false)
                  setAlertSaved(false)
                }}
                className="rounded-lg p-1.5 text-[#596780] hover:bg-[#F7F9FD] hover:text-[#101828]"
                aria-label="Close alerts modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {alertSaved ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-[#D4E3FC] bg-[#EAF1FF] p-4 text-sm text-[#10213D]">
                  Preference saved locally in your browser for <strong>{alertKeyword}</strong>. To
                  receive live platform notifications and matching alerts, finish registering your
                  candidate account.
                </div>
                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAlertsOpen(false)
                      setAlertSaved(false)
                    }}
                    className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-semibold text-[#101828]"
                  >
                    Close
                  </button>
                  <Link
                    to="/register?role=candidate"
                    className="rounded-xl bg-[#0756D7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B55B9]"
                  >
                    Create account
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveAlertDraft} className="mt-5 space-y-4">
                <div>
                  <label className="label" htmlFor="alert-keyword">
                    Role or skill keyword
                  </label>
                  <input
                    id="alert-keyword"
                    type="text"
                    required
                    value={alertKeyword}
                    onChange={(e) => setAlertKeyword(e.target.value)}
                    placeholder="e.g. Frontend Developer, React, Data Analyst"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="alert-email">
                    Email address
                  </label>
                  <input
                    id="alert-email"
                    type="email"
                    required
                    value={alertEmail}
                    onChange={(e) => setAlertEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input"
                  />
                </div>
                <p className="text-xs text-[#596780]">
                  Live notifications are managed from your Appliety candidate dashboard after
                  registration.
                </p>
                <div className="flex justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setAlertsOpen(false)}
                    className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-semibold text-[#101828]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#0756D7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B55B9]"
                  >
                    Save preference
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
