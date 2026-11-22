import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import type { CandidateMatch, Job, Paginated } from '../../types'
import { ScoreBadge } from '../../components/ScoreBadge'
import { MatchBreakdownView } from '../../components/MatchBreakdown'
import { EmptyState, Spinner } from '../../components/ui'
import { EDUCATION_STATUS_LABELS, WORK_MODE_LABELS, label } from '../../lib/labels'

export function CompanyMatching() {
  const [params, setParams] = useSearchParams()
  const jobId = params.get('job')
  const [jobs, setJobs] = useState<Job[]>([])
  const [matches, setMatches] = useState<CandidateMatch[]>([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [q, setQ] = useState('')
  const [minScore, setMinScore] = useState('')
  const [source, setSource] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    api.get<Paginated<Job>>('/jobs/', { params: { page_size: 100 } })
      .then(({ data }) => setJobs(data.results))
      .finally(() => setLoadingJobs(false))
  }, [])

  useEffect(() => {
    if (!jobId) {
      setMatches([])
      return
    }
    setLoadingMatches(true)
    const query: Record<string, unknown> = { job: jobId, limit: 50 }
    if (q.trim()) query.q = q.trim()
    if (minScore) query.min_score = Number(minScore)
    if (source) query.source = source
    api.get<CandidateMatch[]>('/matching/candidates/', { params: query })
      .then(({ data }) => setMatches(data))
      .finally(() => setLoadingMatches(false))
  }, [jobId, q, minScore, source])

  const selected = jobs.find((j) => String(j.id) === jobId)

  const setJob = (value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set('job', value)
    else next.delete('job')
    setParams(next)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-2xl">✨</span>
        <h1 className="text-2xl font-bold text-slate-900">Ranking de candidatos</h1>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-slate-500">
        Escolha uma vaga para ranquear candidatos por compatibilidade. O score é um apoio à
        decisão — analise o currículo antes de aprovar ou rejeitar.
      </p>

      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label className="label">Vaga</label>
          <select className="input" value={jobId ?? ''} onChange={(e) => setJob(e.target.value)} disabled={loadingJobs}>
            <option value="">Selecione uma vaga…</option>
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.title} ({j.status === 'published' ? 'publicada' : j.status})</option>)}
          </select>
        </div>
        <div>
          <label className="label">Buscar candidato/competência</label>
          <input className="input" placeholder="Nome ou habilidade…" value={q} onChange={(e) => setQ(e.target.value)} disabled={!jobId} />
        </div>
        <div>
          <label className="label">Score mínimo</label>
          <input className="input" type="number" min={0} max={100} placeholder="Ex.: 50" value={minScore} onChange={(e) => setMinScore(e.target.value)} disabled={!jobId} />
        </div>
      </div>
      <div className="card mb-6 flex flex-wrap items-center gap-3 p-4">
        <span className="text-sm font-medium text-slate-600">Origem:</span>
        {([['', 'Todos'], ['applications', 'Apenas quem se candidatou']] as const).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setSource(v)}
            disabled={!jobId}
            className={`badge px-3 py-1.5 text-sm ring-1 ring-inset ${source === v ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-600 ring-slate-200'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {loadingJobs ? (
        <Spinner />
      ) : !jobId ? (
        <EmptyState title="Selecione uma vaga" hint="Escolha uma vaga acima para gerar o ranking de candidatos." />
      ) : loadingMatches ? (
        <Spinner />
      ) : matches.length === 0 ? (
        <EmptyState title="Nenhum candidato encontrado" hint="Ajuste os filtros ou aguarde novos cadastros." />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">{matches.length} candidato(s) ranqueado(s){selected ? ` para “${selected.title}”` : ''}</p>
          {matches.map((m, i) => {
            const c = m.candidate
            const name = `${c.user.first_name} ${c.user.last_name}`.trim() || c.user.username
            return (
              <div key={c.id} className="card p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-brand-500 text-sm font-bold text-white">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">
                      {name} <span className="font-normal text-slate-400">· @{c.user.username}</span>
                    </p>
                    <p className="text-sm text-slate-500">
                      {c.headline || 'Candidato(a)'}
                      {c.experience_years ? ` · ${c.experience_years} ano(s) de experiência` : ''}
                      {c.city ? ` · ${c.city}` : ''}
                    </p>
                    {c.bio && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{c.bio}</p>}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.skills.map((s) => (
                        <span key={s.id} className="badge bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200">{s.name}</span>
                      ))}
                    </div>
                  </div>
                  <ScoreBadge score={m.score} />
                  <button
                    className="text-xs font-medium text-brand-600 hover:underline"
                    onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                  >
                    {expanded === c.id ? 'Ocultar análise' : 'Analisar currículo'}
                  </button>
                </div>

                {expanded === c.id && (
                  <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 lg:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-sm font-bold text-slate-700">Análise por critério</h4>
                      <MatchBreakdownView match={m} />
                    </div>
                    <div className="space-y-3 text-sm">
                      <div>
                        <h4 className="mb-1 text-sm font-bold text-slate-700">Experiências</h4>
                        {c.experiences.length === 0 ? (
                          <p className="text-xs text-slate-400">Não informado no currículo.</p>
                        ) : (
                          <ul className="space-y-2">
                            {c.experiences.map((e) => (
                              <li key={e.id} className="rounded-lg bg-slate-50 p-2">
                                <p className="font-medium text-slate-800">{e.role} — {e.company}</p>
                                <p className="text-xs text-slate-500">
                                  {e.start}{e.end ? ` a ${e.end}` : e.is_current ? ' — atual' : ''}
                                </p>
                                {e.description && <p className="mt-0.5 text-xs text-slate-600">{e.description}</p>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <h4 className="mb-1 text-sm font-bold text-slate-700">Formação</h4>
                        {c.educations.length === 0 ? (
                          <p className="text-xs text-slate-400">Não informado no currículo.</p>
                        ) : (
                          <ul className="space-y-1">
                            {c.educations.map((e) => (
                              <li key={e.id} className="text-xs text-slate-600">
                                {e.course} — {e.institution}{e.year ? ` (${e.year})` : ''} · {label(EDUCATION_STATUS_LABELS, e.status)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        Preferências: área {c.preferred_category || '—'} · localização {c.preferred_location || c.city || '—'} ·{' '}
                        {c.preferred_work_modes.length ? c.preferred_work_modes.map((m) => label(WORK_MODE_LABELS, m)).join(', ') : 'modelos não informados'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
