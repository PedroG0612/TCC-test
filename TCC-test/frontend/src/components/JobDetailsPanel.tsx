import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Job, JobMatch } from '../types'
import { CompanyLogo } from './CompanyLogo'
import { ScoreBadge } from './ScoreBadge'
import { MatchBreakdownView } from './MatchBreakdown'
import { ErrorAlert, Spinner } from './ui'
import { formatSalary } from './JobCard'
import {
  CATEGORY_LABELS, JOB_TYPE_LABELS, SENIORITY_LABELS, WORK_MODE_LABELS, label,
} from '../lib/labels'

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">{title}</h3>
      {children}
    </section>
  )
}

function MatchingCard({ job }: { job: Job }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [match, setMatch] = useState<JobMatch | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const analyze = () => {
    setState('loading')
    setErrorMsg('')
    api.get<JobMatch>(`/jobs/${job.id}/match/`)
      .then(({ data }) => {
        setMatch(data)
        setState('done')
      })
      .catch((e) => {
        setState('error')
        setErrorMsg(
          e.response?.status === 404
            ? 'Seu perfil de candidato está incompleto.'
            : e.response?.data?.detail ?? 'Não foi possível analisar a correspondência.',
        )
      })
  }

  return (
    <div className="card mt-4 border-brand-200 bg-brand-50/60 p-5">
      {state === 'idle' && (
        <>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </span>
            <div>
              <h3 className="font-bold text-slate-900">Compatibilidade com seu perfil</h3>
              <p className="mt-1 text-sm text-slate-600">
                Descubra o quanto seu perfil corresponde às qualificações desta vaga.
              </p>
            </div>
          </div>
          <button onClick={analyze} className="btn-outline mt-4 !border-brand-300 !text-brand-700 hover:!bg-brand-50">
            Ver detalhes da correspondência
          </button>
        </>
      )}

      {state === 'loading' && (
        <div className="flex items-center gap-3 py-2">
          <Spinner />
          <p className="text-sm text-slate-600">Analisando seu perfil…</p>
        </div>
      )}

      {state === 'error' && (
        <div>
          <ErrorAlert message={errorMsg} />
          {errorMsg.includes('incompleto') && (
            <Link to="/profile" className="mt-2 inline-block text-sm font-semibold text-brand-600 hover:underline">
              Completar meu perfil →
            </Link>
          )}
          <button onClick={analyze} className="btn-outline mt-3">Tentar novamente</button>
        </div>
      )}

      {state === 'done' && match && (
        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Compatibilidade</h3>
            <ScoreBadge score={match.score} />
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-800">{match.score}/100</p>
          <div className="mt-3">
            <MatchBreakdownView match={match} />
          </div>
          <button onClick={() => setState('idle')} className="mt-3 text-xs font-semibold text-slate-500 hover:text-brand-600">
            Refazer análise
          </button>
        </div>
      )}
    </div>
  )
}

export function JobDetailsPanel({ job, onBack }: { job: Job; onBack?: () => void }) {
  const { user } = useAuth()
  const [stage, setStage] = useState<'idle' | 'review' | 'sending' | 'sent'>('idle')
  const [applied, setApplied] = useState(!!job.has_applied)
  const [coverLetter, setCoverLetter] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(!!job.is_saved)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setStage('idle')
    setApplied(!!job.has_applied)
    setSaved(!!job.is_saved)
    setCoverLetter('')
    setError('')
  }, [job.id, job.has_applied, job.is_saved])

  const confirmApply = async () => {
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

  const toggleSave = async () => {
    if (!user || saving) return
    setSaving(true)
    try {
      const { data } = await api.post<{ saved: boolean }>('/saved-jobs/', { job: job.id })
      setSaved(data.saved)
    } catch {
      /* keep current state */
    } finally {
      setSaving(false)
    }
  }

  const isCandidate = user?.role === 'candidate'
  const salary = formatSalary(job)
  const applying = stage === 'review' || stage === 'sending'

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-100 p-5 sm:p-6">
        {onBack && (
          <button onClick={onBack} className="mb-3 text-sm font-medium text-slate-500 hover:text-brand-600 lg:hidden">
            ← Voltar para as vagas
          </button>
        )}
        <div className="flex items-start gap-4">
          <CompanyLogo name={job.company_name} logo={job.company_logo} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">{job.company_name}</p>
            <h2 className="mt-0.5 text-xl font-bold text-slate-900 sm:text-2xl">{job.title}</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              {job.location} • {label(WORK_MODE_LABELS, job.work_mode)}
              {job.seniority ? ` • ${label(SENIORITY_LABELS, job.seniority)}` : ''}
              {' '}• {timeAgo(job.created_at)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {isCandidate && stage !== 'sent' && !applied && (
            <button onClick={() => setStage('review')} className="btn-primary">
              Candidatar-se
            </button>
          )}
          {isCandidate && (applied || stage === 'sent') && (
            <span className="badge bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200">✓ Candidatura enviada</span>
          )}
          {user ? (
            <button
              onClick={toggleSave}
              disabled={saving}
              className={`btn-outline inline-flex items-center gap-1.5 ${saved ? '!border-brand-300 !text-brand-700' : ''}`}
            >
              <svg className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              {saved ? 'Salva' : 'Salvar vaga'}
            </button>
          ) : (
            <Link to="/login" className="btn-outline">Entrar para salvar</Link>
          )}
          <Link to={`/jobs/${job.id}`} className="btn-ghost text-sm">
            Ver página completa ↗
          </Link>
        </div>

        {/* Apply flow */}
        {isCandidate && stage !== 'sent' && applying && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            {(
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-800">Revise sua candidatura</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                  <li>Vaga: <strong>{job.title}</strong> — {job.company_name}</li>
                  <li>Seu perfil e currículo serão enviados junto à candidatura.</li>
                </ul>
                <textarea
                  className="input min-h-24"
                  placeholder="Apresentação para a empresa (opcional)…"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
                {error && <ErrorAlert message={error} />}
                <div className="flex gap-2">
                  <button onClick={() => setStage('idle')} className="btn-outline">Voltar</button>
                  <button onClick={confirmApply} disabled={stage === 'sending'} className="btn-primary">
                    {stage === 'sending' ? 'Enviando…' : 'Confirmar e enviar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {stage === 'sent' && (
          <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
            ✓ Candidatura enviada para <strong>{job.company_name}</strong>. Acompanhe em{' '}
            <Link to="/applications" className="font-semibold underline">Minhas candidaturas</Link>.
          </p>
        )}
      </div>

      {/* Body */}
      <div className="space-y-6 p-5 sm:p-6">
        {/* Info grid */}
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Tipo', label(JOB_TYPE_LABELS, job.job_type)],
            ['Modelo', label(WORK_MODE_LABELS, job.work_mode)],
            ['Nível', label(SENIORITY_LABELS, job.seniority)],
            ['Área', label(CATEGORY_LABELS, job.category)],
            ['Remuneração', salary ?? 'Não informada'],
            ['Publicada', timeAgo(job.created_at)],
            ['Candidaturas', String(job.application_count ?? '—')],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-slate-50 px-3 py-2.5">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{k}</dt>
              <dd className="mt-0.5 truncate text-sm font-semibold text-slate-800" title={v}>{v}</dd>
            </div>
          ))}
        </dl>

        <Section title="Sobre a vaga">
          <p className="whitespace-pre-line leading-relaxed text-slate-700">{job.description}</p>
        </Section>

        {job.responsibilities && (
          <Section title="Responsabilidades">
            <Bullets text={job.responsibilities} />
          </Section>
        )}

        {job.requirements && (
          <Section title="Requisitos">
            <Bullets text={job.requirements} />
          </Section>
        )}

        {(job.essential_skills.length > 0 || job.desired_skills.length > 0) && (
          <Section title="Competências">
            <div className="flex flex-wrap gap-2">
              {job.essential_skills.map((s) => (
                <span key={s.id} className="badge bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200">{s.name}</span>
              ))}
              {job.desired_skills.map((s) => (
                <span key={s.id} className="badge bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200">{s.name}</span>
              ))}
            </div>
          </Section>
        )}

        {/* Matching — candidates only, computed on demand */}
        {isCandidate && <MatchingCard key={job.id} job={job} />}

        <p className="text-xs text-slate-400">
          O score de compatibilidade é um apoio à decisão — não aprova nem reprova
          candidatos automaticamente.
        </p>
      </div>
    </div>
  )
}
