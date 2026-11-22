import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Job, Paginated } from '../types'
import { EmptyState, Spinner } from '../components/ui'
import { CompanyLogo } from '../components/CompanyLogo'
import { JobDetailsPanel } from '../components/JobDetailsPanel'
import {
  CATEGORY_LABELS, JOB_TYPE_LABELS, WORK_MODE_LABELS, label,
} from '../lib/labels'

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  if (days < 7) return `Há ${days} dias`
  return new Date(iso).toLocaleDateString('pt-BR')
}

function JobListItem({ job, selected, onSelect }: {
  job: Job; selected: boolean; onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-start gap-3 border-l-4 px-4 py-4 text-left transition-colors ${
        selected
          ? 'border-brand-600 bg-brand-50/70'
          : 'border-transparent hover:bg-slate-50'
      }`}
    >
      <CompanyLogo name={job.company_name} logo={job.company_logo} size="sm" />
      <div className="min-w-0 flex-1">
        <h3 className={`truncate text-[15px] font-semibold ${selected ? 'text-brand-800' : 'text-slate-900'}`}>
          {job.title}
        </h3>
        <p className="truncate text-sm text-slate-500">{job.company_name}</p>
        <p className="mt-1 truncate text-xs text-slate-400">
          {job.location} • {label(WORK_MODE_LABELS, job.work_mode)} • {label(JOB_TYPE_LABELS, job.job_type)}
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
          <span>{timeAgo(job.created_at)}</span>
          {!!job.application_count && job.application_count > 0 && (
            <span className="badge bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200">
              {job.application_count} {job.application_count === 1 ? 'candidatura' : 'candidaturas'}
            </span>
          )}
          {job.has_applied && (
            <span className="badge bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200">Candidatado</span>
          )}
        </div>
      </div>
    </button>
  )
}

function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function Jobs() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [jobs, setJobs] = useState<Job[]>([])
  const [nextUrl, setNextUrl] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selected, setSelected] = useState<Job | null>(null)

  const q = params.get('q') ?? ''
  const category = params.get('category') ?? ''
  const location = params.get('location') ?? ''
  const skill = params.get('skill') ?? ''
  const workMode = params.get('work_mode') ?? ''
  const jobType = params.get('job_type') ?? ''
  const days = params.get('days') ?? ''
  const ordering = params.get('ordering') ?? '-created_at'
  const page = Number(params.get('page') ?? '1')
  const jobParam = params.get('job')

  const buildQuery = useCallback((p: number) => {
    const query: Record<string, unknown> = { page: p, ordering }
    if (q) query.q = q
    if (category) query.category = category
    if (location) query.location = location
    if (skill) query.skill = skill
    if (workMode) query.work_mode = workMode
    if (jobType) query.job_type = jobType
    if (days) query.created_after = daysAgoISO(Number(days))
    return query
  }, [q, category, location, skill, workMode, jobType, days, ordering])

  // First page / filter changes
  useEffect(() => {
    setLoading(true)
    api.get<Paginated<Job>>('/jobs/', { params: buildQuery(1) })
      .then(({ data }) => {
        setJobs(data.results)
        setCount(data.count)
        setNextUrl(data.next)
      })
      .catch(() => {
        setJobs([])
        setCount(0)
        setNextUrl(null)
      })
      .finally(() => setLoading(false))
  }, [buildQuery])

  const loadMore = () => {
    if (!nextUrl || loadingMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    api.get<Paginated<Job>>('/jobs/', { params: buildQuery(nextPage) })
      .then(({ data }) => {
        setJobs((prev) => [...prev, ...data.results])
        setNextUrl(data.next)
        const next = new URLSearchParams(params)
        next.set('page', String(nextPage))
        setParams(next, { replace: true })
      })
      .finally(() => setLoadingMore(false))
  }

  // Resolve the selected job (?job=<id>) from the list or by direct fetch.
  useEffect(() => {
    if (!jobParam) {
      setSelected(null)
      return
    }
    const id = Number(jobParam)
    const found = jobs.find((j) => j.id === id)
    if (found) {
      setSelected(found)
      return
    }
    api.get<Job>(`/jobs/${id}/`)
      .then(({ data }) => setSelected(data))
      .catch(() => setSelected(null))
  }, [jobParam, jobs])

  // Auto-select the first result on desktop when nothing is selected.
  useEffect(() => {
    if (selected || loading || jobs.length === 0) return
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setSelected(jobs[0])
      const next = new URLSearchParams(params)
      next.set('job', String(jobs[0].id))
      setParams(next, { replace: true })
    }
  }, [jobs, loading, selected, params, setParams])

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next)
  }

  const selectJob = (job: Job) => {
    setSelected(job)
    setParam('job', String(job.id))
  }

  const clearSelection = () => {
    const next = new URLSearchParams(params)
    next.delete('job')
    setParams(next)
  }

  const hasFilters = !!(q || category || location || skill || workMode || jobType || days)

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Buscar vagas</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {count} {count === 1 ? 'vaga encontrada' : 'vagas encontradas'}
          </h1>
        </div>
      </div>

      {/* Search + filters */}
      <div className="card mt-4 p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              className="input !pl-9"
              placeholder="Título, empresa ou palavra-chave"
              defaultValue={q}
              onKeyDown={(e) => e.key === 'Enter' && setParam('q', (e.target as HTMLInputElement).value)}
              onBlur={(e) => setParam('q', e.target.value)}
            />
          </div>
          <input
            className="input sm:w-44"
            placeholder="Cidade ou região"
            defaultValue={location}
            onKeyDown={(e) => e.key === 'Enter' && setParam('location', (e.target as HTMLInputElement).value)}
            onBlur={(e) => setParam('location', e.target.value)}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select className="input !w-auto" value={category} onChange={(e) => setParam('category', e.target.value)} aria-label="Área">
            <option value="">Todas as áreas</option>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className="input !w-auto" value={workMode} onChange={(e) => setParam('work_mode', e.target.value)} aria-label="Modelo de trabalho">
            <option value="">Qualquer modelo</option>
            {Object.entries(WORK_MODE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className="input !w-auto" value={jobType} onChange={(e) => setParam('job_type', e.target.value)} aria-label="Tipo de vínculo">
            <option value="">Qualquer vínculo</option>
            {Object.entries(JOB_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className="input !w-auto" value={days} onChange={(e) => setParam('days', e.target.value)} aria-label="Data de publicação">
            <option value="">Qualquer data</option>
            <option value="7">Publicadas nos últimos 7 dias</option>
            <option value="30">Publicadas nos últimos 30 dias</option>
          </select>
          <select className="input !w-auto" value={ordering} onChange={(e) => setParam('ordering', e.target.value)} aria-label="Ordenar por">
            <option value="-created_at">Mais recentes</option>
            <option value="created_at">Mais antigas</option>
            <option value="title">Título (A–Z)</option>
          </select>
          {hasFilters && (
            <button
              className="text-sm font-semibold text-brand-600 hover:underline"
              onClick={() => setParams(new URLSearchParams({ ordering }))}
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Two panels */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(340px,38%)_1fr]">
        {/* Left — job listings */}
        <aside className={`card overflow-hidden ${selected ? 'hidden lg:block' : 'block'}`}>
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8"><Spinner /></div>
            ) : jobs.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Nenhuma vaga encontrada."
                  hint="Amplie a busca: remova filtros ou use termos mais gerais."
                  action={hasFilters ? (
                    <button className="btn-primary" onClick={() => setParams(new URLSearchParams({ ordering }))}>
                      Revisar minha busca
                    </button>
                  ) : undefined}
                />
              </div>
            ) : (
              jobs.map((job) => (
                <JobListItem
                  key={job.id}
                  job={job}
                  selected={selected?.id === job.id}
                  onSelect={() => selectJob(job)}
                />
              ))
            )}
          </div>
          {nextUrl && !loading && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full border-t border-slate-100 py-3 text-sm font-semibold text-brand-600 hover:bg-brand-50 disabled:opacity-50"
            >
              {loadingMore ? 'Carregando…' : 'Carregar mais vagas'}
            </button>
          )}
        </aside>

        {/* Right — selected job details */}
        <section className={selected ? 'block' : 'hidden lg:block'}>
          {selected ? (
            <div className="max-h-[75vh] overflow-y-auto">
              <JobDetailsPanel job={selected} onBack={clearSelection} />
            </div>
          ) : (
            <div className="card flex min-h-64 flex-col items-center justify-center p-10 text-center">
              <p className="text-lg font-bold text-slate-800">Selecione uma vaga</p>
              <p className="mt-1 text-sm text-slate-500">
                Escolha uma oportunidade na lista ao lado para ver os detalhes,
                se candidatar e analisar a compatibilidade com seu perfil.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* CTA for anonymous visitors */}
      {!user && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="card flex flex-col gap-3 border-brand-200 bg-brand-50 p-6">
            <p className="eyebrow">Para quem busca</p>
            <h3 className="text-lg font-bold text-slate-900">Sua carreira, organizada.</h3>
            <p className="text-sm text-slate-500">
              Crie seu perfil e acompanhe cada candidatura em um único painel.
            </p>
            <Link to="/register?role=candidate" className="btn-primary mt-2 w-fit">
              Criar conta de candidato →
            </Link>
          </div>
          <div className="card flex flex-col gap-3 border-accent-200 bg-accent-50 p-6">
            <p className="eyebrow">Para quem contrata</p>
            <h3 className="text-lg font-bold text-slate-900">Abra espaço para novos talentos.</h3>
            <p className="text-sm text-slate-500">
              Publique vagas, organize perfis e avalie candidaturas com critérios explicáveis.
            </p>
            <Link to="/register?role=company" className="btn-accent mt-2 w-fit">
              Cadastrar uma empresa →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
