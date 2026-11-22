import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../../lib/api'
import type { Application, Job, Paginated } from '../../types'
import { StatusBadge } from '../../components/StatusBadge'
import { EmptyState, ErrorAlert, Spinner } from '../../components/ui'
import { APPLICATION_STATUS_LABELS as STATUS_LABELS, label } from '../../lib/labels'

const NEXT_STATUSES = ['applied', 'under_review', 'interview', 'rejected', 'hired']

export function JobApplications() {
  const { id } = useParams()
  const [job, setJob] = useState<Job | null>(null)
  const [data, setData] = useState<Paginated<Application> | null>(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const fetchAll = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get<Job>(`/jobs/${id}/`),
      api.get<Paginated<Application>>('/applications/', {
        params: { job: id, page_size: 100, ...(status ? { status } : {}) },
      }),
    ]).then(([j, a]) => {
      setJob(j.data)
      setData(a.data)
    }).catch(() => setError('Não foi possível carregar as candidaturas.'))
      .finally(() => setLoading(false))
  }, [id, status])

  useEffect(fetchAll, [fetchAll])

  const changeStatus = async (app: Application, newStatus: string) => {
    try {
      await api.patch(`/applications/${app.id}/`, { status: newStatus })
      fetchAll()
    } catch {
      setError('Não foi possível atualizar o status.')
    }
  }

  if (loading) return <Spinner />
  if (!job) return <div className="mx-auto max-w-4xl px-4 py-16"><ErrorAlert message={error || 'Vaga não encontrada.'} /></div>

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link to="/company/jobs" className="text-sm font-medium text-slate-500 hover:text-brand-600">← Minhas vagas</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
          <p className="text-sm text-slate-500">
            {job.company_name} · {job.location}
          </p>
        </div>
        <Link to={`/company/matching?job=${job.id}`} className="btn-accent">✨ Ranking de candidatos</Link>
      </div>

      <div className="mt-6 mb-4 flex flex-wrap gap-2">
        <button onClick={() => setStatus('')} className={`badge px-3 py-1.5 text-sm ring-1 ring-inset ${!status ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-600 ring-slate-200'}`}>Todas</button>
        {NEXT_STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`badge px-3 py-1.5 text-sm ring-1 ring-inset ${status === s ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-600 ring-slate-200'}`}>
            {label(STATUS_LABELS, s)}
          </button>
        ))}
      </div>

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      {!data || data.results.length === 0 ? (
        <EmptyState title="Nenhuma candidatura" hint="As candidaturas desta vaga aparecerão aqui." />
      ) : (
        <div className="space-y-3">
          {data.results.map((app) => (
            <div key={app.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button className="text-left" onClick={() => setExpanded(expanded === app.id ? null : app.id)}>
                  <p className="font-semibold text-slate-900">{app.candidate_name}</p>
                  <p className="text-sm text-slate-500">{app.candidate_email} · enviada em {new Date(app.created_at).toLocaleDateString('pt-BR')}</p>
                </button>
                <div className="flex items-center gap-2">
                  <select
                    className="input !w-auto !py-1.5 text-xs"
                    value={app.status}
                    onChange={(e) => changeStatus(app, e.target.value)}
                  >
                    {NEXT_STATUSES.map((s) => <option key={s} value={s}>{label(STATUS_LABELS, s)}</option>)}
                  </select>
                </div>
              </div>

              {expanded === app.id && (
                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
                  {app.cover_letter ? (
                    <p className="whitespace-pre-line text-slate-700">{app.cover_letter}</p>
                  ) : (
                    <p className="text-slate-400">Nenhuma carta de apresentação enviada.</p>
                  )}
                  {app.status_history.length > 0 && (
                    <div className="mt-3 border-t border-slate-200 pt-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Histórico</p>
                      <ul className="space-y-1 text-xs text-slate-500">
                        {app.status_history.map((h) => (
                          <li key={h.id}>
                            {new Date(h.created_at).toLocaleString('pt-BR')} — {h.status_display}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
