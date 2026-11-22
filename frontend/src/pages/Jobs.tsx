import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import type { Job, Paginated } from '../types'
import { JobCard } from '../components/JobCard'
import { EmptyState, Spinner } from '../components/ui'

export function Jobs() {
  const [params, setParams] = useSearchParams()
  const [data, setData] = useState<Paginated<Job> | null>(null)
  const [loading, setLoading] = useState(true)

  const q = params.get('q') ?? ''
  const category = params.get('category') ?? ''
  const location = params.get('location') ?? ''
  const workMode = params.get('work_mode') ?? ''
  const page = Number(params.get('page') ?? '1')

  const fetchJobs = useCallback(() => {
    setLoading(true)
    const query: Record<string, unknown> = { page }
    if (q) query.q = q
    if (category) query.category = category
    if (location) query.location = location
    if (workMode) query.work_mode = workMode
    api.get<Paginated<Job>>('/jobs/', { params: query })
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false))
  }, [q, category, location, workMode, page])

  useEffect(fetchJobs, [fetchJobs])

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next)
  }

  const categories = ['technology', 'design', 'marketing', 'business', 'engineering', 'health', 'education', 'other']

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Find jobs</h1>
        <p className="mt-1 text-sm text-slate-500">
          {data ? `${data.count} open ${data.count === 1 ? 'vacancy' : 'vacancies'}` : 'Searching…'}
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className="input"
          placeholder="Search title, skill, company…"
          defaultValue={q}
          onKeyDown={(e) => e.key === 'Enter' && setParam('q', (e.target as HTMLInputElement).value)}
          onBlur={(e) => setParam('q', e.target.value)}
        />
        <select className="input" value={category} onChange={(e) => setParam('category', e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
        </select>
        <input
          className="input"
          placeholder="Location"
          defaultValue={location}
          onKeyDown={(e) => e.key === 'Enter' && setParam('location', (e.target as HTMLInputElement).value)}
          onBlur={(e) => setParam('location', e.target.value)}
        />
        <select className="input" value={workMode} onChange={(e) => setParam('work_mode', e.target.value)}>
          <option value="">Any work mode</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">On-site</option>
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : !data || data.results.length === 0 ? (
        <EmptyState title="No vacancies found" hint="Try adjusting your search or filters." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.results.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          {data.next && (
            <div className="mt-8 text-center">
              <button className="btn-outline" onClick={() => setParam('page', String(page + 1))}>
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
