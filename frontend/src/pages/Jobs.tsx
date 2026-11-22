import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import type { Job, Paginated } from '../types'
import { JobCard } from '../components/JobCard'
import { EmptyState, Spinner } from '../components/ui'
import { CATEGORY_LABELS, WORK_MODE_LABELS, label } from '../lib/labels'

export function Jobs() {
  const [params, setParams] = useSearchParams()
  const [data, setData] = useState<Paginated<Job> | null>(null)
  const [loading, setLoading] = useState(true)

  const q = params.get('q') ?? ''
  const category = params.get('category') ?? ''
  const location = params.get('location') ?? ''
  const skill = params.get('skill') ?? ''
  const workMode = params.get('work_mode') ?? ''
  const ordering = params.get('ordering') ?? '-created_at'
  const page = Number(params.get('page') ?? '1')

  const fetchJobs = useCallback(() => {
    setLoading(true)
    const query: Record<string, unknown> = { page, ordering }
    if (q) query.q = q
    if (category) query.category = category
    if (location) query.location = location
    if (skill) query.skill = skill
    if (workMode) query.work_mode = workMode
    api.get<Paginated<Job>>('/jobs/', { params: query })
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false))
  }, [q, category, location, skill, workMode, ordering, page])

  useEffect(fetchJobs, [fetchJobs])

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Buscar vagas</h1>
        <p className="mt-1 text-sm text-slate-500">
          {data ? `${data.count} ${data.count === 1 ? 'vaga encontrada' : 'vagas encontradas'}` : 'Buscando…'}
        </p>
      </div>

      {/* Filters — Figma "Busca consolidada": título/área, cidade, competência */}
      <div className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className="input"
          placeholder="Título ou área…"
          defaultValue={q}
          onKeyDown={(e) => e.key === 'Enter' && setParam('q', (e.target as HTMLInputElement).value)}
          onBlur={(e) => setParam('q', e.target.value)}
        />
        <input
          className="input"
          placeholder="Cidade…"
          defaultValue={location}
          onKeyDown={(e) => e.key === 'Enter' && setParam('location', (e.target as HTMLInputElement).value)}
          onBlur={(e) => setParam('location', e.target.value)}
        />
        <input
          className="input"
          placeholder="Competência…"
          defaultValue={skill}
          onKeyDown={(e) => e.key === 'Enter' && setParam('skill', (e.target as HTMLInputElement).value)}
          onBlur={(e) => setParam('skill', e.target.value)}
        />
        <select className="input" value={ordering} onChange={(e) => setParam('ordering', e.target.value)}>
          <option value="-created_at">Mais recentes</option>
          <option value="title">Título (A–Z)</option>
          <option value="-title">Título (Z–A)</option>
        </select>
      </div>

      <div className="card mb-6 grid gap-3 p-4 sm:grid-cols-3">
        <select className="input" value={category} onChange={(e) => setParam('category', e.target.value)}>
          <option value="">Todas as áreas</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="input" value={workMode} onChange={(e) => setParam('work_mode', e.target.value)}>
          <option value="">Qualquer modelo</option>
          {Object.entries(WORK_MODE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {(q || category || location || skill || workMode) && (
          <button
            className="btn-ghost text-sm"
            onClick={() => setParams(new URLSearchParams({ ordering }))}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : !data || data.results.length === 0 ? (
        <EmptyState title="Nenhuma vaga encontrada" hint="Tente ajustar sua busca ou os filtros." />
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
                Carregar mais
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
