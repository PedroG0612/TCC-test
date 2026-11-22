import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import type { Application, Paginated } from '../../types'
import { StatusBadge } from '../../components/StatusBadge'
import { EmptyState, Spinner } from '../../components/ui'

const STATUSES = ['applied', 'under_review', 'interview', 'rejected', 'hired']

export function AdminApplications() {
  const [params] = useSearchParams()
  const jobFilter = params.get('job')
  const [data, setData] = useState<Paginated<Application> | null>(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchApps = useCallback(() => {
    setLoading(true)
    api.get<Paginated<Application>>('/applications/', {
      params: {
        page_size: 50,
        ...(status ? { status } : {}),
        ...(jobFilter ? { job: jobFilter } : {}),
      },
    }).then(({ data }) => setData(data)).finally(() => setLoading(false))
  }, [status, jobFilter])

  useEffect(fetchApps, [fetchApps])

  const changeStatus = async (app: Application, newStatus: string) => {
    await api.patch(`/applications/${app.id}/`, { status: newStatus })
    fetchApps()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Acompanhamento de candidaturas</h1>
      <p className="mt-1 text-sm text-slate-500">{data ? `${data.count} candidaturas` : ''}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => setStatus('')} className={`badge px-3 py-1.5 text-sm ring-1 ring-inset ${!status ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-600 ring-slate-200'}`}>All</button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`badge px-3 py-1.5 text-sm ring-1 ring-inset capitalize ${status === s ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-600 ring-slate-200'}`}>
            {s === 'applied' ? 'Enviada' : s === 'under_review' ? 'Em análise' : s === 'interview' ? 'Entrevista' : s === 'rejected' ? 'Não avançou' : 'Contratado'}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : !data || data.results.length === 0 ? (
        <EmptyState title="Nenhuma candidatura" />
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Candidato</th>
                <th className="px-4 py-3">Vaga</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Enviada em</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.results.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{app.candidate_name}</p>
                    <p className="text-xs text-slate-400">{app.candidate_email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{app.job_title}</td>
                  <td className="px-4 py-3 text-slate-600">{app.company_name}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(app.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <select
                      className="input !w-36 !py-1 text-xs"
                      value={app.status}
                      onChange={(e) => changeStatus(app, e.target.value)}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s === 'applied' ? 'Enviada' : s === 'under_review' ? 'Em análise' : s === 'interview' ? 'Entrevista' : s === 'rejected' ? 'Não avançou' : 'Contratado'}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
