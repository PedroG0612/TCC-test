import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import type { Job, Paginated } from '../../types'
import { StatusBadge } from '../../components/StatusBadge'
import { EmptyState, Spinner } from '../../components/ui'
import { JOB_STATUS_LABELS, WORK_MODE_LABELS, label } from '../../lib/labels'

const FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'draft', label: 'Rascunhos' },
  { value: 'published', label: 'Publicadas' },
  { value: 'paused', label: 'Pausadas' },
]

export function CompanyJobs() {
  const navigate = useNavigate()
  const [data, setData] = useState<Paginated<Job> | null>(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchJobs = useCallback(() => {
    setLoading(true)
    api.get<Paginated<Job>>('/jobs/', {
      params: { page_size: 50, ...(status ? { status } : {}) },
    }).then(({ data }) => setData(data)).finally(() => setLoading(false))
  }, [status])

  useEffect(fetchJobs, [fetchJobs])

  const remove = async (job: Job) => {
    if (!window.confirm(`Excluir “${job.title}”? Esta ação não pode ser desfeita.`)) return
    try {
      await api.delete(`/jobs/${job.id}/`)
      fetchJobs()
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Não foi possível excluir a vaga.')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Minhas vagas</h1>
          <p className="mt-1 text-sm text-slate-500">{data ? `${data.count} no total` : ''}</p>
        </div>
        <Link to="/company/jobs/new" className="btn-primary">+ Publicar vaga</Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value || 'all'}
            onClick={() => setStatus(f.value)}
            className={`badge px-3 py-1.5 text-sm ring-1 ring-inset ${status === f.value ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-600 ring-slate-200'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <Spinner />
      ) : !data || data.results.length === 0 ? (
        <EmptyState
          title="Nenhuma vaga"
          hint="Crie sua primeira vaga para começar a receber candidaturas."
          action={<Link to="/company/jobs/new" className="btn-primary">Criar vaga</Link>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.results.map((job) => (
            <div key={job.id} className="card flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link to={`/jobs/${job.id}`} className="font-semibold text-slate-900 hover:text-brand-700">
                    {job.title}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {job.location} · {label(WORK_MODE_LABELS, job.work_mode)} · {job.job_type === 'internship' ? 'Estágio' : job.job_type}
                  </p>
                </div>
                <StatusBadge status={job.status} />
              </div>
              <p className="text-xs text-slate-400">
                {job.application_count ?? 0} candidatura(s) · publicada em {new Date(job.created_at).toLocaleDateString('pt-BR')}
              </p>
              <div className="mt-auto flex flex-wrap gap-2">
                <Link to={`/company/jobs/${job.id}/edit`} className="btn-outline !px-3 !py-1.5 text-xs">Editar</Link>
                <Link to={`/company/jobs/${job.id}/applications`} className="btn-accent !px-3 !py-1.5 text-xs">
                  Candidaturas ({job.application_count ?? 0})
                </Link>
                <Link to={`/company/matching?job=${job.id}`} className="btn-ghost !px-3 !py-1.5 text-xs">Matching</Link>
                <button onClick={() => remove(job)} className="ml-auto text-xs font-medium text-red-500 hover:text-red-700">
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
