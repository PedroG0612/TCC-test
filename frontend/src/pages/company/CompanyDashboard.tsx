import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import type { CompanyStats, Paginated, Job } from '../../types'
import { JobCard } from '../../components/JobCard'
import { StatusBadge } from '../../components/StatusBadge'
import { Spinner, StatCard } from '../../components/ui'

export function CompanyDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<CompanyStats | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<CompanyStats>('/reports/company/').catch(() => null),
      api.get<Paginated<Job>>('/jobs/', { params: { page_size: 4 } }).catch(() => ({ data: { results: [] } })),
    ]).then(([s, j]) => {
      setStats(s?.data ?? null)
      setJobs(j.data.results)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {user?.company_profile?.company_name ?? 'Empresa'} — Painel
          </h1>
          <p className="mt-1 text-sm text-slate-500">Gerencie suas vagas e candidaturas.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/company/matching" className="btn-accent">✨ Matching</Link>
          <Link to="/company/jobs/new" className="btn-primary">+ Publicar vaga</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Vagas publicadas" value={stats?.totals.published_jobs ?? 0} />
        <StatCard label="Total de candidaturas" value={stats?.totals.applications ?? 0} accent="violet" />
        <StatCard label="Em análise" value={stats?.applications_by_status?.under_review ?? 0} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Suas vagas</h2>
            <Link to="/company/jobs" className="text-sm font-semibold text-brand-600 hover:underline">Gerenciar todas</Link>
          </div>
          <div className="space-y-3">
            {jobs.length === 0 ? (
              <p className="card p-6 text-sm text-slate-500">Nenhuma vaga ainda — publique a primeira!</p>
            ) : (
              jobs.map((job) => <JobCard key={job.id} job={job} showStatus />)
            )}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Candidaturas recentes</h2>
          </div>
          {!stats || stats.recent_applications.length === 0 ? (
            <p className="card p-6 text-sm text-slate-500">Nenhuma candidatura recebida ainda.</p>
          ) : (
            <div className="card divide-y divide-slate-100">
              {stats.recent_applications.map((app) => (
                <div key={app.id} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium text-slate-900">{app.candidate}</p>
                    <p className="text-sm text-slate-500">{app.job}</p>
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
