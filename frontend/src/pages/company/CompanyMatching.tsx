import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import type { CandidateMatch, Job, Paginated } from '../../types'
import { ScoreBadge } from '../../components/ScoreBadge'
import { EmptyState, Spinner } from '../../components/ui'

export function CompanyMatching() {
  const [params, setParams] = useSearchParams()
  const jobId = params.get('job')
  const [jobs, setJobs] = useState<Job[]>([])
  const [matches, setMatches] = useState<CandidateMatch[]>([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [loadingMatches, setLoadingMatches] = useState(false)

  useEffect(() => {
    api.get<Paginated<Job>>('/jobs/', { params: { page_size: 100, status: 'published' } })
      .then(({ data }) => setJobs(data.results))
      .finally(() => setLoadingJobs(false))
  }, [])

  useEffect(() => {
    if (!jobId) {
      setMatches([])
      return
    }
    setLoadingMatches(true)
    api.get<CandidateMatch[]>('/matching/candidates/', { params: { job: jobId } })
      .then(({ data }) => setMatches(data))
      .finally(() => setLoadingMatches(false))
  }, [jobId])

  const selected = jobs.find((j) => String(j.id) === jobId)

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-2xl">✨</span>
        <h1 className="text-2xl font-bold text-slate-900">Candidate matching</h1>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-slate-500">
        Pick one of your vacancies to see the candidates whose profiles best match its requirements.
      </p>

      <div className="card mb-6 p-4">
        <label className="label">Vacancy</label>
        <select
          className="input"
          value={jobId ?? ''}
          onChange={(e) => {
            const next = new URLSearchParams(params)
            if (e.target.value) next.set('job', e.target.value)
            else next.delete('job')
            setParams(next)
          }}
        >
          <option value="">Select a vacancy…</option>
          {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        {selected && <p className="mt-2 text-xs text-slate-400">{selected.company_name} · {selected.location}</p>}
      </div>

      {loadingJobs ? (
        <Spinner />
      ) : !jobId ? (
        <EmptyState title="Select a vacancy" hint="Choose a job above to generate candidate recommendations." />
      ) : loadingMatches ? (
        <Spinner />
      ) : matches.length === 0 ? (
        <EmptyState title="No candidate matches" hint="There are no candidate profiles in the platform yet." />
      ) : (
        <div className="space-y-4">
          {matches.map((m, i) => (
            <div key={m.candidate.id} className="card flex flex-wrap items-start gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-brand-500 text-sm font-bold text-white">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">
                  {m.candidate.user.first_name} {m.candidate.user.last_name} · @{m.candidate.user.username}
                </p>
                <p className="text-sm text-slate-500">
                  {m.candidate.headline || 'Candidate'}
                  {m.candidate.experience_years ? ` · ${m.candidate.experience_years}y experience` : ''}
                  {m.candidate.education ? ` · ${m.candidate.education}` : ''}
                </p>
                {m.candidate.bio && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{m.candidate.bio}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.candidate.skills.map((s) => (
                    <span key={s.id} className="badge bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200">{s.name}</span>
                  ))}
                  {m.matched_skills.length > 0 && (
                    <span className="badge bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200">
                      matches: {m.matched_skills.join(', ')}
                    </span>
                  )}
                </div>
              </div>
              <ScoreBadge score={m.score} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
