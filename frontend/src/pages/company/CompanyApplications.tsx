import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import type { Application, Job, Paginated } from '../../types'
import { StatusBadge } from '../../components/StatusBadge'
import { EmptyState, ErrorAlert, Spinner } from '../../components/ui'
import { AreaHeader } from '../../components/figma'
import { APPLICATION_STATUS_LABELS, label } from '../../lib/labels'

const STATUSES = ['applied', 'under_review', 'interview', 'rejected', 'hired']

/** Consolidated applications across all of the company's vacancies (Figma). */
export function CompanyApplications() {
  const [data, setData] = useState<Paginated<Application> | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobId, setJobId] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Paginated<Job>>('/jobs/', { params: { page_size: 100 } })
      .then(({ data }) => setJobs(data.results))
      .catch(() => {})
  }, [])

  const fetchApps = useCallback(() => {
    setLoading(true)
    api.get<Paginated<Application>>('/applications/', {
      params: {
        page_size: 100,
        ...(jobId ? { job: jobId } : {}),
        ...(status ? { status } : {}),
      },
    }).then(({ data }) => setData(data))
      .catch(() => setError('Não foi possível carregar as candidaturas.'))
      .finally(() => setLoading(false))
  }, [jobId, status])

  useEffect(fetchApps, [fetchApps])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <AreaHeader
        eyebrow="EMPRESA / CANDIDATURAS"
        title="Candidaturas"
        subtitle={data ? `${data.count} candidatura(s) recebida(s) em todas as suas vagas.` : 'Todas as candidaturas das suas vagas.'}
      />

      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-3">
        <select className="input" value={jobId} onChange={(e) => setJobId(e.target.value)}>
          <option value="">Todas as vagas</option>
          {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{label(APPLICATION_STATUS_LABELS, s)}</option>)}
        </select>
        {(jobId || status) && (
          <button className="btn-ghost text-sm" onClick={() => { setJobId(''); setStatus('') }}>Limpar filtros</button>
        )}
      </div>

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      {loading ? (
        <Spinner />
      ) : !data || data.results.length === 0 ? (
        <EmptyState title="Nenhuma candidatura" hint="As candidaturas das suas vagas aparecerão aqui." />
      ) : (
        <div className="card divide-y divide-slate-100">
          {data.results.map((app) => (
            <div key={app.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="font-semibold text-slate-900">{app.candidate_name}</p>
                <p className="text-sm text-slate-500">
                  {app.candidate_email} · candidatou-se a{' '}
                  <Link to={`/company/jobs/${app.job}/applications`} className="font-medium text-brand-600 hover:underline">
                    {app.job_title}
                  </Link>
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Enviada em {new Date(app.created_at).toLocaleDateString('pt-BR')}
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
