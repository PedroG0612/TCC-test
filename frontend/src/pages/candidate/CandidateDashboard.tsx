import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import type { Application, JobMatch, Paginated } from '../../types'
import { JobCard } from '../../components/JobCard'
import { StatusBadge } from '../../components/StatusBadge'
import { ScoreBadge } from '../../components/ScoreBadge'
import { Spinner, StatCard } from '../../components/ui'

export function CandidateDashboard() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<JobMatch[]>([])
  const [apps, setApps] = useState<Paginated<Application> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<JobMatch[]>('/matching/jobs/', { params: { limit: 3 } }).catch(() => ({ data: [] })),
      api.get<Paginated<Application>>('/applications/', { params: { page_size: 5 } }).catch(() => ({ data: null })),
    ]).then(([m, a]) => {
      setMatches(m.data)
      setApps(a.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const profile = user?.candidate_profile
  const profileComplete = !!(profile?.headline && profile?.bio)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.first_name || user?.username} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">Here's what's happening with your job search.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/matching" className="btn-accent">✨ View matches</Link>
          <Link to="/jobs" className="btn-outline">Find jobs</Link>
        </div>
      </div>

      {!profileComplete && (
        <div className="card mb-6 flex flex-wrap items-center justify-between gap-3 border-accent-200 bg-accent-50 p-5">
          <p className="text-sm text-accent-800">
            💡 Complete your profile to get better job matches — add a headline, bio and skills.
          </p>
          <Link to="/profile" className="btn-accent !py-2">Complete profile</Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Applications sent" value={apps?.count ?? 0} />
        <StatCard label="Top match score" value={matches[0]?.score ?? '—'} accent="violet" />
        <StatCard label="Skills listed" value={profile?.skills.length ?? 0} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* Recommended matches */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recommended for you</h2>
            <Link to="/matching" className="text-sm font-semibold text-brand-600 hover:underline">See all</Link>
          </div>
          {matches.length === 0 ? (
            <p className="card p-6 text-sm text-slate-500">No recommendations yet — keep browsing jobs.</p>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => (
                <Link key={m.job.id} to={`/jobs/${m.job.id}`} className="card flex items-center justify-between gap-3 p-4 transition-shadow hover:shadow-card-hover">
                  <div>
                    <p className="font-semibold text-slate-900">{m.job.title}</p>
                    <p className="text-sm text-slate-500">{m.job.company_name} · {m.job.location}</p>
                  </div>
                  <ScoreBadge score={m.score} />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent applications */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent applications</h2>
            <Link to="/applications" className="text-sm font-semibold text-brand-600 hover:underline">See all</Link>
          </div>
          {!apps || apps.results.length === 0 ? (
            <p className="card p-6 text-sm text-slate-500">You haven't applied to any jobs yet.</p>
          ) : (
            <div className="card divide-y divide-slate-100">
              {apps.results.map((app) => (
                <div key={app.id} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium text-slate-900">{app.job_title}</p>
                    <p className="text-sm text-slate-500">{app.company_name}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
