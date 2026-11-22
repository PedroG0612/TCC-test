import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import type { Application, ApplicationStatus, Paginated } from '../../types'
import { StatusBadge } from '../../components/StatusBadge'
import { EmptyState, Spinner } from '../../components/ui'
import { APPLICATION_STATUS_LABELS, label } from '../../lib/labels'

const STATUSES: ApplicationStatus[] = ['applied', 'under_review', 'interview', 'rejected', 'hired']

const NEXT_STEP: Record<ApplicationStatus, string> = {
  applied: 'A empresa ainda não iniciou a análise.',
  under_review: 'Seu perfil está sendo avaliado pela empresa.',
  interview: 'Parabéns! A empresa quer conversar com você.',
  rejected: 'Esta candidatura não avançou. Continue explorando outras vagas.',
  hired: 'Parabéns! Você foi selecionado(a) para esta vaga.',
}

const TIMELINE_ORDER: ApplicationStatus[] = ['applied', 'under_review', 'interview', 'hired']

function ApplicationTimeline({ app }: { app: Application }) {
  const reached = new Set(app.status_history.map((h) => h.to_status))
  reached.add('applied')
  return (
    <ol className="mt-3 flex flex-wrap items-center gap-1 text-xs">
      {TIMELINE_ORDER.map((s, i) => {
        const done = reached.has(s) || (app.status === 'rejected' && TIMELINE_ORDER.indexOf(s) <= TIMELINE_ORDER.indexOf('interview'))
        const current = app.status === s || (app.status === 'rejected' && s === 'interview' && reached.has('interview'))
        return (
          <li key={s} className="flex items-center gap-1">
            <span className={`rounded-full px-2 py-0.5 font-medium ${
              done ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-400'
            } ${current ? 'ring-1 ring-brand-500' : ''}`}>
              {label(APPLICATION_STATUS_LABELS, s)}
            </span>
            {i < TIMELINE_ORDER.length - 1 && <span className="text-slate-300">→</span>}
          </li>
        )
      })}
      {app.status === 'rejected' && (
        <li className="ml-1 rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700">Não avançou</li>
      )}
    </ol>
  )
}

export function MyApplications() {
  const [data, setData] = useState<Paginated<Application> | null>(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

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
          <h1 className="text-2xl font-bold text-slate-900">Minhas candidaturas</h1>
          <p className="mt-1 text-sm text-slate-500">Acompanhe o status de cada candidatura enviada.</p>
        </div>
        <Link to="/jobs" className="btn-primary">Buscar vagas</Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setStatus('')}
          className={`badge px-3 py-1.5 text-sm ring-1 ring-inset ${!status ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-600 ring-slate-200'}`}
        >
          Todas
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`badge px-3 py-1.5 text-sm ring-1 ring-inset ${status === s ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-600 ring-slate-200'}`}
          >
            {label(APPLICATION_STATUS_LABELS, s)}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : !data || data.results.length === 0 ? (
        <EmptyState
          title="Nenhuma candidatura ainda"
          hint="Explore as vagas abertas e candidate-se às que combinam com você."
          action={<Link to="/jobs" className="btn-primary">Ver vagas</Link>}
        />
      ) : (
        <div className="card divide-y divide-slate-100">
          {data.results.map((app) => (
            <div key={app.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link to={`/jobs/${app.job}`} className="font-semibold text-slate-900 hover:text-brand-700">
                    {app.job_title}
                  </Link>
                  <p className="text-sm text-slate-500">{app.company_name}</p>
                  {app.cover_letter && (
                    <p className="mt-1 line-clamp-2 max-w-xl text-xs text-slate-400">“{app.cover_letter}”</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    Candidatura enviada em {new Date(app.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{NEXT_STEP[app.status]}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="text-xs font-medium text-brand-600 hover:underline"
                    onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                  >
                    {expanded === app.id ? 'Ocultar histórico' : 'Ver histórico'}
                  </button>
                  <StatusBadge status={app.status} />
                </div>
              </div>
              {expanded === app.id && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <ApplicationTimeline app={app} />
                  {app.status_history.length > 0 && (
                    <ul className="mt-3 space-y-1 text-xs text-slate-500">
                      {app.status_history.map((h) => (
                        <li key={h.id}>
                          {new Date(h.created_at).toLocaleString('pt-BR')} — status alterado para{' '}
                          <strong>{h.status_display}</strong>
                        </li>
                      ))}
                    </ul>
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
