import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import type { Application, Paginated } from '../../types'
import { StatusBadge } from '../../components/StatusBadge'
import { EmptyState, Spinner } from '../../components/ui'

const STATUSES = ['applied', 'under_review', 'shortlisted', 'rejected', 'hired']

export function MyApplications() {
  const [data, setData] = useState<Paginated<Application> | null>(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchApps = useCallback(() => {
    setLoading(true)
    api.get<Paginated<Application>>('/applications/', {
      params: { ...(status ? { status } : {}), page_size: 50 },
    }).then(({ data }) => setData(data)).finally(() => setLoading(false))
  }, [status])

  useEffect(fetchApps, [fetchApps])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My applications</h1>
          <p className="mt-1 text-sm text-slate-500">Track the status of every application you've sent.</p>
        </div>
        <Link to="/jobs" className="btn-primary">Find more jobs</Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setStatus('')}
          className={`badge px-3 py-1.5 text-sm ring-1 ring-inset ${!status ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-600 ring-slate-200'}`}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`badge px-3 py-1.5 text-sm ring-1 ring-inset capitalize ${status === s ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-600 ring-slate-200'}`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : !data || data.results.length === 0 ? (
        <EmptyState
          title="No applications yet"
          hint="Browse open vacancies and apply to the ones that match you."
          action={<Link to="/jobs" className="btn-primary">Browse jobs</Link>}
        />
      ) : (
        <div className="card divide-y divide-slate-100">
          {data.results.map((app) => (
            <div key={app.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <Link to={`/jobs/${app.job}`} className="font-semibold text-slate-900 hover:text-brand-700">
                  {app.job_title}
                </Link>
                <p className="text-sm text-slate-500">{app.company_name}</p>
                {app.cover_letter && (
                  <p className="mt-1 line-clamp-2 max-w-xl text-xs text-slate-400">“{app.cover_letter}”</p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  Applied {new Date(app.created_at).toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status={app.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
