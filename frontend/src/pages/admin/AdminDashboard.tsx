import { useEffect, useState } from 'react'
import api from '../../lib/api'
import type { PlatformOverview } from '../../types'
import { Spinner, StatCard } from '../../components/ui'

export function AdminDashboard() {
  const [stats, setStats] = useState<PlatformOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<PlatformOverview>('/reports/overview/')
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (!stats) return <p className="p-10 text-center text-sm text-slate-500">Could not load statistics.</p>

  const t = stats.totals
  const maxMonthly = Math.max(...stats.monthly_applications.map((m) => m.count), 1)
  const maxCategory = Math.max(...stats.applications_by_category.map((c) => c.count), 1)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Platform-wide statistics and reports.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Users" value={t.users} />
        <StatCard label="Candidates" value={t.candidates} />
        <StatCard label="Companies" value={t.companies} />
        <StatCard label="Jobs" value={t.jobs} />
        <StatCard label="Applications" value={t.applications} accent="violet" />
        <StatCard label="Last 30 days" value={t.applications_last_30_days} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Monthly applications */}
        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Applications per month</h2>
          <div className="flex h-40 items-end gap-2">
            {stats.monthly_applications.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-semibold text-slate-500">{m.count}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-accent-500"
                  style={{ height: `${Math.max(4, (m.count / maxMonthly) * 100)}%` }}
                />
                <span className="text-[10px] text-slate-400">{m.month.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Applications by category */}
        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Most requested areas</h2>
          {stats.applications_by_category.length === 0 ? (
            <p className="text-sm text-slate-400">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.applications_by_category.map((c) => (
                <div key={c.category}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{c.label}</span>
                    <span className="text-slate-500">{c.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500" style={{ width: `${(c.count / maxCategory) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Applications per job */}
        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Applications per vacancy</h2>
          {stats.applications_per_job.length === 0 ? (
            <p className="text-sm text-slate-400">No applications yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.applications_per_job.map((row, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{row.job}</p>
                    <p className="text-xs text-slate-400">{row.company}</p>
                  </div>
                  <span className="badge bg-brand-50 text-brand-700">{row.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top skills */}
        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Most demanded skills</h2>
          {stats.top_skills.length === 0 ? (
            <p className="text-sm text-slate-400">No data yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stats.top_skills.map((s) => (
                <span key={s.skill} className="badge bg-accent-50 px-3 py-1.5 text-sm text-accent-700 ring-1 ring-inset ring-accent-200">
                  {s.skill} · {s.count}
                </span>
              ))}
            </div>
          )}
          <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-700">Top locations</h3>
          <div className="flex flex-wrap gap-2">
            {stats.top_locations.map((l) => (
              <span key={l.location} className="badge bg-slate-100 px-3 py-1.5 text-sm text-slate-600">
                📍 {l.location} · {l.count}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
