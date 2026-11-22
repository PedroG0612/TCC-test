import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Job, JobMatch } from '../types'
import { StatusBadge } from '../components/StatusBadge'
import { ScoreBadge } from '../components/ScoreBadge'
import { MatchBreakdownView } from '../components/MatchBreakdown'
import { ErrorAlert, Field, Spinner } from '../components/ui'
import { formatSalary } from '../components/JobCard'
import {
  CATEGORY_LABELS, JOB_TYPE_LABELS, SENIORITY_LABELS, WORK_MODE_LABELS, label,
} from '../lib/labels'

type Tab = 'overview' | 'responsibilities' | 'requirements' | 'howto'

export function JobDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [match, setMatch] = useState<JobMatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [coverLetter, setCoverLetter] = useState('')
  const [stage, setStage] = useState<'idle' | 'review' | 'sending' | 'sent'>('idle')
  const [applied, setApplied] = useState(false)

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

  if (loading) return <Spinner />
  if (!job) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorAlert message={error || 'Vaga não encontrada.'} /></div>

  const salary = formatSalary(job)
  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Visão geral' },
    { key: 'responsibilities', label: 'Responsabilidades' },
    { key: 'requirements', label: 'Requisitos' },
    { key: 'howto', label: 'Como se candidatar' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link to="/jobs" className="text-sm font-medium text-slate-500 hover:text-brand-600">← Voltar para vagas</Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {job.company_logo ? (
                  <img src={job.company_logo} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-lg font-bold text-white">
                    {job.company_name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
                  <p className="text-slate-500">{job.company_name}</p>
                </div>
              </div>
              {user?.role === 'company' || user?.role === 'admin' ? (
                <StatusBadge status={job.status} />
              ) : applied || stage === 'sent' ? (
                <span className="badge bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200">✓ Candidatura enviada</span>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              <span>📍 {job.location}</span>
              <span>{label(WORK_MODE_LABELS, job.work_mode)}</span>
              <span>{label(JOB_TYPE_LABELS, job.job_type)}</span>
              <span>{label(SENIORITY_LABELS, job.seniority)}</span>
              {job.contract_type && <span>{job.contract_type}</span>}
              <span className="badge bg-slate-100 text-slate-600">{label(CATEGORY_LABELS, job.category)}</span>
              {salary && <span className="font-semibold text-brand-700">{salary}</span>}
            </div>

            {/* Tabs */}
            <div className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
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
                  <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Sobre a vaga</h2>
                  <p className="whitespace-pre-line text-slate-700">{job.description}</p>
                </section>
              )}
              {tab === 'responsibilities' && (
                <section>
                  <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Responsabilidades</h2>
                  <p className="whitespace-pre-line text-slate-700">
                    {job.responsibilities || 'Não informado pela empresa.'}
                  </p>
                </section>
              )}
              {tab === 'requirements' && (
                <section className="space-y-5">
                  <div>
                    <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Requisitos</h2>
                    <p className="whitespace-pre-line text-slate-700">
                      {job.requirements || 'Não informado pela empresa.'}
                    </p>
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
                      <h3 className="mb-2 text-sm font-semibold text-slate-700">Competências desejáveis</h3>
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
                <section className="space-y-3 text-slate-700">
                  <p>Para se candidatar, clique em <strong>“Quero me candidatar”</strong> e revise suas informações antes do envio.</p>
                  <p>Sua candidatura será enviada diretamente para a empresa, que poderá analisar seu perfil e currículo.</p>
                  <p>Você pode acompanhar o status em <Link to="/applications" className="font-semibold text-brand-600 hover:underline">Minhas candidaturas</Link>.</p>
                </section>
              )}
            </div>
          </div>

          {/* Apply flow: review → confirm → sent */}
          {user?.role === 'candidate' && stage !== 'sent' && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-slate-900">Candidatar-se a esta vaga</h2>
              {applied ? (
                <p className="mt-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
                  Você já se candidatou a esta vaga. Acompanhe em{' '}
                  <Link to="/applications" className="font-semibold underline">Minhas candidaturas</Link>.
                </p>
              ) : stage === 'idle' ? (
                <div className="mt-4">
                  <p className="text-sm text-slate-600">
                    Revise sua candidatura antes do envio. Você poderá adicionar uma carta de apresentação.
                  </p>
                  <button onClick={() => setStage('review')} className="btn-primary mt-4">
                    Quero me candidatar
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <p className="font-semibold text-slate-800">Revisão da candidatura</p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-slate-600">
                      <li>Vaga: <strong>{job.title}</strong> — {job.company_name}</li>
                      <li>Seu perfil e currículo serão enviados junto à candidatura.</li>
                      <li>Você poderá acompanhar o andamento em Minhas candidaturas.</li>
                    </ul>
                  </div>
                  <Field label="Carta de apresentação (opcional)">
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
              <h2 className="text-xl font-bold text-slate-900">Candidatura enviada!</h2>
              <p className="mt-2 text-sm text-slate-600">
                Sua candidatura para <strong>{job.title}</strong> foi recebida por {job.company_name}.
                Acompanhe o status em{' '}
                <Link to="/applications" className="font-semibold text-brand-600 hover:underline">Minhas candidaturas</Link>.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
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

          <div className="card p-5">
            <h3 className="font-bold text-slate-900">Resumo</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Local</dt><dd className="font-medium text-slate-800">{job.location}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Modelo</dt><dd className="font-medium text-slate-800">{label(WORK_MODE_LABELS, job.work_mode)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Tipo</dt><dd className="font-medium text-slate-800">{label(JOB_TYPE_LABELS, job.job_type)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Senioridade</dt><dd className="font-medium text-slate-800">{label(SENIORITY_LABELS, job.seniority)}</dd></div>
              {job.contract_type && <div className="flex justify-between"><dt className="text-slate-500">Contrato</dt><dd className="font-medium text-slate-800">{job.contract_type}</dd></div>}
              {salary && <div className="flex justify-between"><dt className="text-slate-500">Salário</dt><dd className="font-semibold text-brand-700">{salary}</dd></div>}
            </dl>
          </div>

          {!user && (
            <div className="card flex flex-col gap-3 p-5">
              <p className="text-sm text-slate-600">Quer se candidatar? Crie uma conta de candidato ou entre.</p>
              <Link to="/register?role=candidate" className="btn-primary text-center">Criar conta</Link>
              <Link to="/login" className="btn-outline text-center">Entrar</Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
