import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import type { JobMatch } from '../../types'
import { ScoreBadge } from '../../components/ScoreBadge'
import { EmptyState, Spinner } from '../../components/ui'

export function Matching() {
  const [matches, setMatches] = useState<JobMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(10)

  useEffect(() => {
    setLoading(true)
    api.get<JobMatch[]>('/matching/jobs/', { params: { limit } })
      .then(({ data }) => setMatches(data))
      .finally(() => setLoading(false))
  }, [limit])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-2xl">✨</span>
        <h1 className="text-2xl font-bold text-slate-900">Your matches</h1>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-slate-500">
        Vacancies ranked by compatibility with your profile. The score blends text
        similarity (TF-IDF + cosine) with shared skills — higher means a better fit.
      </p>

      {loading ? (
        <Spinner />
      ) : matches.length === 0 ? (
        <EmptyState
          title="No matches yet"
          hint="Complete your profile with skills and experience, then check back."
          action={<Link to="/profile" className="btn-primary">Edit profile</Link>}
        />
      ) : (
        <div className="space-y-4">
          {matches.map((m, i) => (
            <Link
              key={m.job.id}
              to={`/jobs/${m.job.id}`}
              className="card flex flex-wrap items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-bold text-white">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{m.job.title}</p>
                <p className="text-sm text-slate-500">
                  {m.job.company_name} · {m.job.location} · {m.job.work_mode}
                </p>
                {m.matched_skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.matched_skills.map((s) => (
                      <span key={s} className="badge bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <ScoreBadge score={m.score} />
            </Link>
          ))}
        </div>
      )}

      {!loading && matches.length >= limit && (
        <div className="mt-6 text-center">
          <button className="btn-outline" onClick={() => setLimit((l) => l + 10)}>
            Show more
          </button>
        </div>
      )}
    </div>
  )
}
