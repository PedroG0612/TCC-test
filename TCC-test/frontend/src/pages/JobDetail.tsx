import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Job, JobMatch } from '../types'
import { StatusBadge } from '../components/StatusBadge'
import { CompanyLogo } from '../components/CompanyLogo'
import { ScoreBadge } from '../components/ScoreBadge'
import { MatchBreakdownView } from '../components/MatchBreakdown'
import { ErrorAlert, Field, Spinner } from '../components/ui'
import { FactRow, NoteCard, StepNav } from '../components/figma'
import { formatSalary } from '../components/JobCard'
import {
  CATEGORY_LABELS, SENIORITY_LABELS, WORK_MODE_LABELS, label,
} from '../lib/labels'

type Tab = 'overview' | 'responsibilities' | 'requirements' | 'howto'

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'Publicada hoje'
  if (days === 1) return 'Publicada há 1 dia'
  return `Publicada há ${days} dias`
}

function Bullets({ text }: { text: string }) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  return (
    <ul className="space-y-2">
      {lines.map((l, i) => (
        <li key={i} className="flex gap-2.5 text-slate-700">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
          <span className="whitespace-pre-line">{l.replace(/^[•\-–]\s*/, '')}</span>
        </li>
      ))}
    </ul>
  )
}

export function JobDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [match, setMatch] = useState<JobMatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [coverLetter, setCoverLetter] = useState('')
  const [stage, setStage] = useState<'idle' | 'review' | 'sending' | 'sent'>('idle')
  const [applied, setApplied] = useState(false)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    api.get<Job>(`/jobs/${id}/`)
      .then(({ data }) => {
        setJob(data)
        setApplied(!!data.has_applied)
      })
      .catch(() => setError('Vaga não encontrada.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (user?.role === 'candidate' && job) {
      api.get(`/jobs/${job.id}/match/`)
        .then(({ data }) => setMatch(data))
        .catch(() => {})
    }
  }, [user, job])

  const confirmApply = async () => {
    if (!job) return
    setStage('sending')
    setError('')
    try {
      await api.post('/applications/', { job: job.id, cover_letter: coverLetter })
      setStage('sent')
      setApplied(true)
    } catch (e: any) {
      setError(e.response?.data?.job?.[0] ?? e.response?.data?.detail ?? 'Não foi possível enviar a candidatura.')
      setStage('review')
    }
  }

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: job?.title, url })
      else {
        await navigator.clipboard.writeText(url)
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      }
    } catch {
      /* user cancelled */
    }
  }

  if (loading) return <Spinner />
  if (!job) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorAlert message={error || 'Vaga não encontrada.'} /></div>

  const salary = formatSalary(job)
  const isCandidate = user?.role === 'candidate'
  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Sobre a vaga' },
    { key: 'responsibilities', label: 'Responsabilidades' },
    { key: 'requirements', label: 'Requisitos' },
    { key: 'howto', label: 'Como se candidatar' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link to="/jobs" className="text-sm font-medium text-slate-500 hover:text-brand-600">
        ← Voltar para os resultados
      </Link>

      {/* Header — Figma: breadcrumb + company + title + meta */}
      <div className="mt-4">
        <p className="eyebrow">
          Buscar vagas / {label(CATEGORY_LABELS, job.category)} / Detalhes da vaga
        </p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <CompanyLogo name={job.company_name} logo={job.company_logo} size="lg" />
            <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">{job.company_name}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{job.title}</h1>
            <p className="mt-2 text-sm text-slate-500">
              {job.location} • {label(WORK_MODE_LABELS, job.work_mode)}
              {job.seniority ? ` • ${label(SENIORITY_LABELS, job.seniority)}` : ''}
              {' '}• {timeAgo(job.created_at)}
            </p>
            </div>
          </div>
          {(user?.role === 'company' || user?.role === 'admin') ? (
            <StatusBadge status={job.status} />
          ) : applied || stage === 'sent' ? (
            <span className="badge bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200">✓ Candidatura enviada</span>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6 sm:p-8">
            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    tab === t.key
                      ? 'border-brand-600 text-brand-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-6">
              {tab === 'overview' && (
                <section>
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Sobre a oportunidade</h2>
                  <p className="whitespace-pre-line leading-relaxed text-slate-700">{job.description}</p>
                  {job.essential_skills.length > 0 && (
                    <div className="mt-6">
                      <h3 className="mb-2 text-sm font-semibold text-slate-700">Competências</h3>
                      <div className="flex flex-wrap gap-2">
                        {[...job.essential_skills, ...job.desired_skills].map((s) => (
                          <span key={s.id} className="badge bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200">{s.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}
              {tab === 'responsibilities' && (
                <section>
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">O que você vai fazer</h2>
                  {job.responsibilities ? (
                    <Bullets text={job.responsibilities} />
                  ) : (
                    <p className="text-slate-500">Não informado pela empresa.</p>
                  )}
                </section>
              )}
              {tab === 'requirements' && (
                <section className="space-y-6">
                  <div>
                    <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">O que buscamos em você</h2>
                    {job.requirements ? (
                      <Bullets text={job.requirements} />
                    ) : (
                      <p className="text-slate-500">Não informado pela empresa.</p>
                    )}
                  </div>
                  {job.essential_skills.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-slate-700">Competências essenciais</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.essential_skills.map((s) => (
                          <span key={s.id} className="badge bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200">{s.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {job.desired_skills.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Diferenciais</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.desired_skills.map((s) => (
                          <span key={s.id} className="badge bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200">{s.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}
              {tab === 'howto' && (
                <section className="space-y-6">
                  <div>
                    <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">Como se candidatar</h2>
                    <ol className="space-y-4">
                      {[
                        ['Prepare seu perfil', 'Atualize seu currículo e destaque projetos, tecnologias e resultados relevantes.'],
                        ['Envie sua candidatura', 'Revise seus dados e confirme o interesse nesta vaga.'],
                        ['Acompanhe pelo painel', 'Consulte o andamento em Minhas candidaturas e fique de olho nos próximos contatos.'],
                      ].map(([t, d], i) => (
                        <li key={t} className="flex gap-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{i + 1}</span>
                          <div>
                            <p className="font-semibold text-slate-900">{t}</p>
                            <p className="mt-0.5 text-sm text-slate-500">{d}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <button onClick={share} className="btn-outline">
                    {shared ? '✓ Link copiado!' : 'Compartilhar vaga ↗'}
                  </button>
                </section>
              )}
            </div>
          </div>

          {/* Apply flow — Figma 04.1/04.2/04.3 */}
          {isCandidate && stage !== 'sent' && (
            <div className="card p-6 sm:p-8" id="apply">
              <p className="eyebrow">Sua candidatura</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                {stage === 'idle' ? 'Vamos conectar seu talento?' : 'Revise sua candidatura'}
              </h2>
              {applied ? (
                <div className="mt-4">
                  <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
                    ✓ Você já se candidatou a esta vaga. Não é necessário enviar novamente —
                    acompanhe em <Link to="/applications" className="font-semibold underline">Minhas candidaturas</Link>.
                  </p>
                </div>
              ) : stage === 'idle' ? (
                <div className="mt-4">
                  <p className="text-sm text-slate-600">
                    Confira os detalhes e revise seu perfil para esta oportunidade.
                    Esta candidatura ainda não foi enviada.
                  </p>
                  <button onClick={() => setStage('review')} className="btn-primary mt-4">
                    Candidatar-se
                  </button>
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  <StepNav steps={['Revisar candidatura', 'Confirmação do envio']} current={0} />
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <p className="font-semibold text-slate-800">
                      ✓ Você está conectada como {user?.first_name || user?.username}
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-slate-600">
                      <li>Vaga: <strong>{job.title}</strong> — {job.company_name}</li>
                      <li>Seu perfil e currículo serão enviados junto à candidatura.</li>
                      <li>Você poderá acompanhar o andamento em Minhas candidaturas.</li>
                    </ul>
                  </div>
                  <Field label="Apresentação para a empresa (opcional)">
                    <textarea
                      className="input min-h-28"
                      placeholder="Conte à empresa por que você é um bom fit…"
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                    />
                  </Field>
                  {error && <ErrorAlert message={error} />}
                  <div className="flex gap-3">
                    <button onClick={() => setStage('idle')} className="btn-outline">Voltar</button>
                    <button onClick={confirmApply} disabled={stage === 'sending'} className="btn-primary">
                      {stage === 'sending' ? 'Enviando…' : 'Confirmar e enviar candidatura'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {stage === 'sent' && (
            <div className="card border-brand-200 bg-brand-50 p-8 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-2xl text-white">✓</div>
              <p className="eyebrow">Confirmação do envio</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Candidatura enviada. Novo caminho aberto.</h2>
              <p className="mt-2 text-sm text-slate-600">
                Sua candidatura para <strong>{job.title}</strong> foi recebida por {job.company_name}.
              </p>
              <div className="mx-auto mt-5 max-w-md text-left">
                <p className="text-sm font-semibold text-slate-800">O que acontece agora?</p>
                <ol className="mt-2 space-y-1.5 text-sm text-slate-600">
                  <li><strong>01</strong> — Recebida pela empresa: seu perfil e currículo estão disponíveis para análise.</li>
                  <li><strong>02</strong> — Análise do perfil: a equipe avaliará sua experiência e as evidências do currículo.</li>
                  <li><strong>03</strong> — Próximos contatos: se houver avanço, acompanhe o painel e o e-mail informado.</li>
                </ol>
              </div>
              <div className="mt-6 flex justify-center gap-3">
                <Link to="/applications" className="btn-primary">Acompanhar candidatura</Link>
                <Link to="/jobs" className="btn-outline">Explorar outras vagas</Link>
              </div>
            </div>
          )}

          {/* CTA banner */}
          <div className="rounded-2xl bg-brand-600 p-8 text-center text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Seu talento, novas possibilidades</p>
            <h2 className="mt-2 text-2xl font-bold">O próximo passo da sua carreira começa aqui.</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/80">
              Mantenha seu perfil atualizado e acompanhe cada candidatura em um só lugar.
            </p>
            {!user && (
              <div className="mt-5 flex justify-center gap-3">
                <Link to="/register?role=candidate" className="btn bg-white text-brand-700 hover:bg-brand-50">Criar conta de candidato</Link>
                <Link to="/login" className="btn border border-white/40 bg-white/10 text-white hover:bg-white/20">Entrar</Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar — Figma "SEU PRÓXIMO PASSO" */}
        <aside className="space-y-6">
          <div className="card p-5">
            <p className="eyebrow">Seu próximo passo</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">Vamos conectar seu talento?</h3>
            <p className="mt-1 text-sm text-slate-500">
              {isCandidate
                ? 'Confira os detalhes e revise seu perfil para esta oportunidade.'
                : 'Entre ou crie sua conta para enviar a candidatura e acompanhar as próximas etapas.'}
            </p>
            <dl className="mt-4 divide-y divide-slate-100">
              <FactRow label="Empresa" value={job.company_name} />
              <FactRow label="Local" value={job.location} />
              <FactRow label="Modelo" value={label(WORK_MODE_LABELS, job.work_mode)} />
              <FactRow label="Área de atuação" value={label(CATEGORY_LABELS, job.category)} />
              <FactRow label="Remuneração e contratação" value={salary ?? 'Não informadas no anúncio'} strong={!!salary} />
            </dl>
            <div className="mt-4 space-y-2">
              {isCandidate ? (
                applied || stage === 'sent' ? (
                  <Link to="/applications" className="btn-outline w-full">Acompanhar candidatura ↗</Link>
                ) : (
                  <button onClick={() => { setStage('review'); document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' }) }} className="btn-primary w-full">
                    Candidatar-se
                  </button>
                )
              ) : user?.role === 'company' || user?.role === 'admin' ? null : (
                <>
                  <Link to="/register?role=candidate" className="btn-primary w-full">Criar conta</Link>
                  <Link to="/login" className="btn-outline w-full">Entrar</Link>
                </>
              )}
            </div>
          </div>

          {match && (
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Compatibilidade</h3>
                <ScoreBadge score={match.score} />
              </div>
              <div className="mt-4">
                <MatchBreakdownView match={match} />
              </div>
            </div>
          )}

          <NoteCard title="Matching não decide por você" tone="slate">
            As recomendações são um apoio à leitura do perfil — nenhuma candidatura
            é aprovada ou rejeitada automaticamente.
          </NoteCard>
        </aside>
      </div>
    </div>
  )
}
