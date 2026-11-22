import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { ConnectionState, PublicProfile } from '../types'
import { EmptyState, Spinner } from '../components/ui'
import { CompanyLogo } from '../components/CompanyLogo'
import {
  CATEGORY_LABELS, EDUCATION_STATUS_LABELS, JOB_TYPE_LABELS, WORK_MODE_LABELS, label,
} from '../lib/labels'

export function PublicProfile() {
  const { username } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [connState, setConnState] = useState<ConnectionState>('none')
  const [connId, setConnId] = useState<number | null>(null)
  const [connBusy, setConnBusy] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get<PublicProfile>(`/public-profiles/${username}/`)
      .then(({ data }) => setData(data))
      .catch(() => setError('Perfil não encontrado.'))
      .finally(() => setLoading(false))
  }, [username])

  const isCandidateViewer = user?.role === 'candidate'
  const showConnect =
    isCandidateViewer && data?.role === 'candidate' && user?.username !== data?.username

  const refreshConn = () => {
    if (!showConnect) return
    api.get<{ state: ConnectionState; connection_id: number | null }>(
      '/connections/status/', { params: { username } }
    ).then(({ data }) => {
      setConnState(data.state)
      setConnId(data.connection_id)
    }).catch(() => {})
  }

  useEffect(refreshConn, [username, data?.role, user?.username]) // eslint-disable-line react-hooks/exhaustive-deps

  const sendRequest = async () => {
    setConnBusy(true)
    try {
      await api.post('/connections/', { username })
      refreshConn()
    } catch { /* ignore */ }
    setConnBusy(false)
  }

  const respond = async (action: 'accept' | 'reject' | 'cancel') => {
    if (!connId) return
    setConnBusy(true)
    try {
      await api.post(`/connections/${connId}/${action}/`)
      refreshConn()
    } catch { /* ignore */ }
    setConnBusy(false)
  }

  const openChat = () => navigate(`/messages?with=${username}`)

  if (loading) return <Spinner />
  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="Perfil não encontrado" hint="Este usuário não existe ou não possui um perfil público." />
      </div>
    )
  }

  const p: any = data.profile ?? {}
  const isCandidate = data.role === 'candidate'
  const isOwn = user?.username === data.username
  const name = data.name
  const avatar = isCandidate ? p.photo_url : p.logo_url
  const cover = p.cover_url
  const headline = isCandidate ? p.headline : p.company_name
  const subtitle = isCandidate ? (data.city || '') : (p.sector || data.city || '')
  const experiences: any[] = p.experiences ?? []
  const educations: any[] = p.educations ?? []
  const skills: any[] = p.skills ?? []
  const certLines = (p.certifications ?? '').split('\n').map((s: string) => s.trim()).filter(Boolean)
  const jobs: any[] = data.jobs ?? []

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to={user ? '/home' : '/'} className="text-sm font-medium text-slate-500 hover:text-brand-600">
        ← {user ? 'Voltar ao feed' : 'Voltar ao início'}
      </Link>

      {/* Hero */}
      <div className="card mt-4 overflow-hidden">
        <div className="relative h-44 bg-brand-600 sm:h-56">
          {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-14 flex items-end justify-between gap-4 sm:-mt-16">
            <div className="relative z-10">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className={`rounded-full border-4 border-white object-cover ${isCandidate ? 'h-28 w-28 sm:h-32 sm:w-32' : 'h-24 w-24 sm:h-28 sm:w-28'}`}
                />
              ) : (
                <div className="rounded-full border-4 border-white bg-white p-1">
                  <CompanyLogo name={name} size="lg" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isOwn && (
                <Link to={isCandidate ? '/profile' : '/company/profile'} className="btn-outline !py-2 text-xs">
                  Editar perfil
                </Link>
              )}
              {showConnect && (
                <>
                  {connState === 'none' && (
                    <button onClick={sendRequest} disabled={connBusy} className="btn-primary !py-2 text-xs">
                      {connBusy ? '…' : 'Conectar'}
                    </button>
                  )}
                  {connState === 'outgoing' && (
                    <button onClick={() => respond('cancel')} disabled={connBusy} className="btn-outline !py-2 text-xs">
                      Pendente · cancelar
                    </button>
                  )}
                  {connState === 'incoming' && (
                    <>
                      <button onClick={() => respond('accept')} disabled={connBusy} className="btn-primary !py-2 text-xs">
                        Aceitar
                      </button>
                      <button onClick={() => respond('reject')} disabled={connBusy} className="btn-outline !py-2 text-xs">
                        Recusar
                      </button>
                    </>
                  )}
                  {connState === 'connected' && (
                    <button onClick={openChat} className="btn-primary !py-2 text-xs">
                      Mensagem
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{name}</h1>
          <p className="mt-0.5 text-base text-slate-600">{headline || (isCandidate ? 'Profissional' : 'Empresa')}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            {subtitle && <span>{subtitle}</span>}
            {data.city && <span>· {data.city}</span>}
            {isCandidate && p.experience_years ? <span>· {p.experience_years} ano(s) de experiência</span> : null}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {isCandidate ? (
          <>
            {p.bio && (
              <section className="card p-6">
                <h2 className="mb-3 text-lg font-bold text-slate-900">Sobre</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{p.bio}</p>
              </section>
            )}

            {experiences.length > 0 && (
              <section className="card p-6">
                <h2 className="mb-4 text-lg font-bold text-slate-900">Experiência</h2>
                <ul className="space-y-4">
                  {experiences.map((e: any) => (
                    <li key={e.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                      <p className="font-semibold text-slate-900">{e.role}</p>
                      <p className="text-sm text-slate-500">{e.company}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{e.start}{e.end ? ` – ${e.end}` : e.is_current ? ' – atual' : ''}</p>
                      {e.description && <p className="mt-1.5 text-sm text-slate-600">{e.description}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {educations.length > 0 && (
              <section className="card p-6">
                <h2 className="mb-4 text-lg font-bold text-slate-900">Formação</h2>
                <ul className="space-y-3">
                  {educations.map((e: any) => (
                    <li key={e.id}>
                      <p className="font-semibold text-slate-900">{e.course}</p>
                      <p className="text-sm text-slate-500">{e.institution}</p>
                      <p className="text-xs text-slate-400">{label(EDUCATION_STATUS_LABELS, e.status)}{e.year ? ` · ${e.year}` : ''}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {skills.length > 0 && (
              <section className="card p-6">
                <h2 className="mb-4 text-lg font-bold text-slate-900">Competências</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s: any) => (
                    <span key={s.id} className="badge bg-brand-50 px-3 py-1.5 text-sm text-brand-700 ring-1 ring-inset ring-brand-200">{s.name}</span>
                  ))}
                </div>
              </section>
            )}

            {certLines.length > 0 && (
              <section className="card p-6">
                <h2 className="mb-3 text-lg font-bold text-slate-900">Certificações</h2>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                  {certLines.map((c: string, i: number) => <li key={i}>{c}</li>)}
                </ul>
              </section>
            )}

            {(p.preferred_category || p.preferred_location || (p.preferred_work_modes ?? []).length > 0) && (
              <section className="card p-6">
                <h2 className="mb-3 text-lg font-bold text-slate-900">Preferências</h2>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  {p.preferred_category && <div><dt className="text-slate-500">Área de interesse</dt><dd className="font-medium text-slate-800">{label(CATEGORY_LABELS, p.preferred_category)}</dd></div>}
                  {p.preferred_location && <div><dt className="text-slate-500">Localização</dt><dd className="font-medium text-slate-800">{p.preferred_location}</dd></div>}
                  {(p.preferred_work_modes ?? []).length > 0 && (
                    <div className="sm:col-span-2"><dt className="text-slate-500">Modelo de trabalho</dt>
                      <dd className="font-medium text-slate-800">{p.preferred_work_modes.map((m: string) => label(WORK_MODE_LABELS, m)).join(', ')}</dd>
                    </div>
                  )}
                </dl>
              </section>
            )}
          </>
        ) : (
          <>
            {p.description && (
              <section className="card p-6">
                <h2 className="mb-3 text-lg font-bold text-slate-900">Sobre a empresa</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{p.description}</p>
              </section>
            )}

            <section className="card p-6">
              <h2 className="mb-4 text-lg font-bold text-slate-900">Informações</h2>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                {p.sector && <div><dt className="text-slate-500">Setor</dt><dd className="font-medium text-slate-800">{p.sector}</dd></div>}
                {p.size && <div><dt className="text-slate-500">Porte</dt><dd className="font-medium text-slate-800">{p.size} funcionários</dd></div>}
                {p.state && <div><dt className="text-slate-500">Estado</dt><dd className="font-medium text-slate-800">{p.state}</dd></div>}
                {p.cnpj && <div><dt className="text-slate-500">CNPJ</dt><dd className="font-medium text-slate-800">{p.cnpj}</dd></div>}
                {data.city && <div><dt className="text-slate-500">Cidade</dt><dd className="font-medium text-slate-800">{data.city}</dd></div>}
                {p.website && (
                  <div className="sm:col-span-2">
                    <dt className="text-slate-500">Website</dt>
                    <dd className="font-medium"><a href={p.website} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">{p.website}</a></dd>
                  </div>
                )}
              </dl>
            </section>

            <section className="card p-6">
              <h2 className="mb-4 text-lg font-bold text-slate-900">Vagas abertas</h2>
              {jobs.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhuma vaga publicada no momento.</p>
              ) : (
                <ul className="space-y-3">
                  {jobs.map((j) => (
                    <li key={j.id}>
                      <Link to={`/jobs/${j.id}`} className="block rounded-xl border border-slate-200 p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/40">
                        <p className="font-semibold text-slate-900">{j.title}</p>
                        <p className="text-xs text-slate-500">
                          {j.location} · {label(WORK_MODE_LABELS, j.work_mode)} · {label(JOB_TYPE_LABELS, j.job_type)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
