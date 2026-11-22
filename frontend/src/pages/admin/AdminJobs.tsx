import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import type { Job, Paginated } from '../../types'
import { StatusBadge } from '../../components/StatusBadge'
import { EmptyState, Spinner } from '../../components/ui'
import { AreaHeader } from '../../components/figma'

export function AdminJobs() {
  const [data, setData] = useState<Paginated<Job> | null>(null)
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchJobs = useCallback(() => {
    setLoading(true)
    api.get<Paginated<Job>>('/jobs/', {
      params: { page_size: 50, ...(status ? { status } : {}), ...(q ? { q } : {}) },
    }).then(({ data }) => setData(data)).finally(() => setLoading(false))
  }, [status, q])

  useEffect(fetchJobs, [fetchJobs])

  const changeStatus = async (job: Job, newStatus: string) => {
    await api.patch(`/jobs/${job.id}/`, { status: newStatus })
    fetchJobs()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <AreaHeader eyebrow="ADMIN / VAGAS" title="Gestão de vagas" subtitle={data ? `${data.count} vagas` : undefined} />

      <div className="mt-5 flex flex-wrap gap-3">
        <input
          className="input !w-64"
          placeholder="Buscar vagas…"
          defaultValue={q}
          onKeyDown={(e) => e.key === 'Enter' && setQ((e.target as HTMLInputElement).value)}
          onBlur={(e) => setQ(e.target.value)}
        />
        {['', 'draft', 'published', 'paused'].map((s) => (
          <button key={s || 'all'} onClick={() => setStatus(s)}
            className={`badge px-3 py-1.5 text-sm ring-1 ring-inset capitalize ${status === s ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-600 ring-slate-200'}`}>
            {!s ? 'Todas' : s === 'draft' ? 'Rascunhos' : s === 'published' ? 'Publicadas' : 'Pausadas'}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : !data || data.results.length === 0 ? (
        <EmptyState title="Nenhuma vaga" />
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Área</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Candidaturas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.results.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/jobs/${job.id}`} className="font-medium text-slate-900 hover:text-brand-700">{job.title}</Link>
                    <p className="text-xs text-slate-400">{job.location}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{job.company_name}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{job.category === 'technology' ? 'Tecnologia' : job.category === 'design' ? 'Design' : job.category === 'marketing' ? 'Marketing' : job.category === 'business' ? 'Negócios' : job.category === 'engineering' ? 'Engenharia' : job.category === 'health' ? 'Saúde' : job.category === 'education' ? 'Educação' : 'Outros'}</td>
                  <td className="px-4 py-3">
                    <select
                      className="input !w-32 !py-1 text-xs"
                      value={job.status}
                      onChange={(e) => changeStatus(job, e.target.value)}
                    >
                      {['draft', 'published', 'paused'].map((s) => <option key={s} value={s}>{s === 'draft' ? 'Rascunho' : s === 'published' ? 'Publicada' : 'Pausada'}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/applications?job=${job.id}`} className="font-semibold text-brand-600 hover:underline">
                      {job.application_count ?? 0}
                    </Link>
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
