import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Job, JobMatch } from '../types'
import { StatusBadge } from '../components/StatusBadge'
import { ScoreBadge } from '../components/ScoreBadge'
import { ErrorAlert, Field, Spinner } from '../components/ui'
import { formatSalary } from '../components/JobCard'

const LABELS: Record<string, string> = {
  technology: 'Technology', design: 'Design', marketing: 'Marketing',
  business: 'Business', engineering: 'Engineering', health: 'Health',
  education: 'Education', other: 'Other',
}
const WORK_MODE: Record<string, string> = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' }
const JOB_TYPE: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time', internship: 'Internship', freelance: 'Freelance',
}

export function JobDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [match, setMatch] = useState<JobMatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    api.get<Job>(`/jobs/${id}/`)
      .then(({ data }) => {
        setJob(data)
        setApplied(!!data.has_applied)
      })
      .catch(() => setError('Vacancy not found.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (user?.role === 'candidate' && job) {
      api.get(`/jobs/${job.id}/match/`)
        .then(({ data }) => setMatch(data))
        .catch(() => {})
    }
  }, [user, job])

  const apply = async () => {
    if (!job) return
    setApplying(true)
    setError('')
    try {
      await api.post('/applications/', { job: job.id, cover_letter: coverLetter })
      setApplied(true)
    } catch (e: any) {
      setError(e.response?.data?.job?.[0] ?? e.response?.data?.detail ?? 'Could not submit application.')
    } finally {
      setApplying(false)
    }
  }

  if (loading) return <Spinner />
  if (!job) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorAlert message={error || 'Vacancy not found.'} /></div>

  const salary = formatSalary(job)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link to="/jobs" className="text-sm font-medium text-slate-500 hover:text-brand-600">← Back to jobs</Link>

      <div className="card mt-4 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-lg font-bold text-white">
              {job.company_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
              <p className="text-slate-500">{job.company_name}</p>
            </div>
          </div>
          {user?.role === 'company' || user?.role === 'admin' ? (
            <StatusBadge status={job.status} />
          ) : job.has_applied ? (
            <span className="badge bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200">Applied ✓</span>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
          <span>📍 {job.location}</span>
          <span>{WORK_MODE[job.work_mode]}</span>
          <span>{JOB_TYPE[job.job_type]}</span>
          <span className="badge bg-slate-100 text-slate-600">{LABELS[job.category] ?? job.category}</span>
          {salary && <span className="font-semibold text-brand-700">{salary}</span>}
        </div>

        {match && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
            <span className="text-sm font-medium text-brand-800">Your compatibility:</span>
            <ScoreBadge score={match.score} />
            {match.matched_skills.length > 0 && (
              <span className="text-xs text-brand-700">
                Shared skills: {match.matched_skills.join(', ')}
              </span>
            )}
          </div>
        )}

        <div className="mt-6 space-y-5">
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">About the role</h2>
            <p className="whitespace-pre-line text-slate-700">{job.description}</p>
          </section>
          {job.requirements && (
            <section>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Requirements</h2>
              <p className="whitespace-pre-line text-slate-700">{job.requirements}</p>
            </section>
          )}
          {job.skills.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((s) => (
                  <span key={s.id} className="badge bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200">{s.name}</span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Apply panel */}
      {user?.role === 'candidate' && (
        <div className="card mt-6 p-6">
          <h2 className="text-lg font-bold text-slate-900">Apply for this position</h2>
          {applied ? (
            <p className="mt-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
              You already applied to this vacancy. Track it in{' '}
              <Link to="/applications" className="font-semibold underline">My applications</Link>.
            </p>
          ) : (
            <div className="mt-4">
              <Field label="Cover letter (optional)">
                <textarea
                  className="input min-h-28"
                  placeholder="Tell the company why you're a great fit…"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </Field>
              {error && <div className="mt-3"><ErrorAlert message={error} /></div>}
              <button onClick={apply} disabled={applying} className="btn-primary mt-4">
                {applying ? 'Submitting…' : 'Submit application'}
              </button>
            </div>
          )}
        </div>
      )}

      {!user && (
        <div className="card mt-6 flex flex-wrap items-center justify-between gap-3 p-6">
          <p className="text-sm text-slate-600">Want to apply? Create a candidate account or log in.</p>
          <div className="flex gap-2">
            <Link to="/register?role=candidate" className="btn-primary">Sign up</Link>
            <Link to="/login" className="btn-outline">Log in</Link>
          </div>
        </div>
      )}
    </div>
  )
}
