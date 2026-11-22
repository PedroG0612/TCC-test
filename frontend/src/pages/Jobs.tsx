import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Job, Paginated } from '../types'
import { EmptyState, Spinner } from '../components/ui'
import { CompanyLogo } from '../components/CompanyLogo'
import { CATEGORY_LABELS, WORK_MODE_LABELS, label } from '../lib/labels'

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'Publicada hoje'
  if (days === 1) return 'Publicada há 1 dia'
  return `Publicada há ${days} dias`
}

function JobRow({ job }: { job: Job }) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="card group flex flex-col gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover sm:flex-row sm:items-center"
    >
      <CompanyLogo name={job.company_name} logo={job.company_logo} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{job.company_name}</p>
        <h3 className="mt-0.5 text-lg font-bold text-slate-900 group-hover:text-brand-700">{job.title}</h3>
        <p className="mt-0.5 text-sm text-slate-500">
          {job.location} • {label(WORK_MODE_LABELS, job.work_mode)}
          {job.salary_min ? ` • ${label(CATEGORY_LABELS, job.category)}` : ''}
        </p>
        {job.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{job.description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
        <span className="text-xs text-slate-400">{timeAgo(job.created_at)}</span>
        <span className="text-sm font-semibold text-brand-600 group-hover:text-brand-700">
          Ver vaga →
        </span>
      </div>
    </Link>
  )
}

export function Jobs() {
  const { user } = useAuth()
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

  const hasFilters = !!(q || category || location || skill || workMode)

  return (
    <div>
      {/* Hero — Figma "Busca consolidada" */}
      <section className="border-b border-slate-200 bg-brand-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="eyebrow">Plataforma de recrutamento</p>
          <h1 className="area-title mt-2">
            Seu talento.<br />Novos caminhos.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
            Encontre oportunidades que combinam com suas competências e acompanhe
            cada candidatura em um só lugar.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Filters */}
        <div className="card mb-8 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              className="input"
              placeholder="Título ou área — Ex.: Design de produto"
              defaultValue={q}
              onKeyDown={(e) => e.key === 'Enter' && setParam('q', (e.target as HTMLInputElement).value)}
              onBlur={(e) => setParam('q', e.target.value)}
            />
            <input
              className="input"
              placeholder="Cidade — Ex.: São Paulo, SP"
              defaultValue={location}
              onKeyDown={(e) => e.key === 'Enter' && setParam('location', (e.target as HTMLInputElement).value)}
              onBlur={(e) => setParam('location', e.target.value)}
            />
            <input
              className="input"
              placeholder="Cargo ou competência — Ex.: Gestão de projetos"
              defaultValue={skill}
              onKeyDown={(e) => e.key === 'Enter' && setParam('skill', (e.target as HTMLInputElement).value)}
              onBlur={(e) => setParam('skill', e.target.value)}
            />
            <select
              className="input"
              value={ordering}
              onChange={(e) => setParam('ordering', e.target.value)}
              aria-label="Ordenar por"
            >
              <option value="-created_at">Ordenar por: Mais recentes</option>
              <option value="created_at">Ordenar por: Mais antigas</option>
              <option value="title">Ordenar por: Título</option>
            </select>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select className="input !w-auto" value={category} onChange={(e) => setParam('category', e.target.value)} aria-label="Área">
              <option value="">Todas as áreas</option>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select className="input !w-auto" value={workMode} onChange={(e) => setParam('work_mode', e.target.value)} aria-label="Modelo de trabalho">
              <option value="">Qualquer modelo</option>
              {Object.entries(WORK_MODE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
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

        {/* Results */}
        <p className="eyebrow">Resultados da busca</p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">
          {data ? `${data.count} ${data.count === 1 ? 'vaga encontrada' : 'vagas encontradas'}` : 'Buscando…'}
        </h2>

        <div className="mt-5">
          {loading ? (
            <Spinner />
          ) : !data || data.results.length === 0 ? (
            <EmptyState
              title="Nenhuma vaga encontrada."
              hint="Vamos ampliar a busca? Use um título mais abrangente, remova uma competência ou busque sem o filtro de cidade."
              action={
                hasFilters ? (
                  <button className="btn-primary" onClick={() => setParams(new URLSearchParams({ ordering }))}>
                    Revisar minha busca ↑
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {data.results.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>

        {data?.next && !loading && (
          <div className="mt-8 text-center">
            <button className="btn-outline" onClick={() => setParam('page', String(page + 1))}>
              Carregar mais
            </button>
          </div>
        )}

        {/* CTA cards — shown only to visitors; logged-in users get role CTAs */}
        {!user ? (
          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            <div className="card flex flex-col gap-3 border-brand-200 bg-brand-50 p-6">
              <p className="eyebrow">Para quem busca</p>
              <h3 className="text-lg font-bold text-slate-900">Sua carreira, organizada.</h3>
              <p className="text-sm text-slate-500">
                Crie seu perfil e acompanhe cada candidatura em um único painel.
                Seu próximo passo começa aqui.
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
        ) : (
          <div className="card mt-14 flex flex-col items-start justify-between gap-4 border-brand-200 bg-brand-50 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="eyebrow">
                {user.role === 'candidate' ? 'Candidato' : user.role === 'company' ? 'Empresa' : 'Admin'}
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">
                {user.role === 'candidate'
                  ? 'Continue de onde parou.'
                  : user.role === 'company'
                    ? 'Gerencie suas vagas e candidaturas.'
                    : 'Acesse o painel administrativo.'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {user.role === 'candidate'
                  ? 'Acompanhe suas candidaturas ou descubra vagas feitas para o seu perfil.'
                  : user.role === 'company'
                    ? 'Publique vagas e analise os melhores perfis com matching explicável.'
                    : 'Relatórios, usuários e moderação da plataforma.'}
              </p>
            </div>
            <Link
              to={user.role === 'candidate' ? '/applications' : user.role === 'company' ? '/company/dashboard' : '/admin/dashboard'}
              className="btn-primary shrink-0"
            >
              {user.role === 'candidate' ? 'Minhas candidaturas →' : user.role === 'company' ? 'Painel de vagas →' : 'Painel admin →'}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
