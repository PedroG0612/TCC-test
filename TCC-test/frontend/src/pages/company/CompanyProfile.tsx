import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import type { Job, Paginated, User } from '../../types'
import { ErrorAlert, Field, Spinner } from '../../components/ui'
import { PasswordSection } from '../../components/PasswordSection'
import { AreaHeader } from '../../components/figma'
import { CompanyLogo } from '../../components/CompanyLogo'
import { JOB_TYPE_LABELS, WORK_MODE_LABELS, label } from '../../lib/labels'

function Pencil({ onClick, label: l }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={l ?? 'Editar'}
      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
      </svg>
    </button>
  )
}

function SectionShell({
  title, onEdit, children, action,
}: {
  title: string
  onEdit?: () => void
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <div className="flex items-center gap-1">
          {action}
          {onEdit && <Pencil onClick={onEdit} />}
        </div>
      </div>
      {children}
    </section>
  )
}

const SIZE_OPTIONS = [
  ['1-10', '1–10 funcionários'],
  ['11-50', '11–50 funcionários'],
  ['51-200', '51-200 funcionários'],
  ['201-500', '201–500 funcionários'],
  ['500+', '500+ funcionários'],
]

export function CompanyProfile() {
  const { user, refresh, updateUser } = useAuth()
  const profile = user?.company_profile

  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [appCount, setAppCount] = useState<number | null>(null)
  const [logoError, setLogoError] = useState(false)
  const [coverError, setCoverError] = useState(false)
  const coverInput = useRef<HTMLInputElement>(null)
  const logoInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLogoError(false)
  }, [profile?.logo_url])

  useEffect(() => {
    setCoverError(false)
  }, [profile?.cover_url])

  useEffect(() => {
    if (!user || !profile) return
    api.get<Paginated<Job>>('/jobs/', { params: { company: profile.id, status: 'published', page_size: 10 } })
      .then(({ data }) => setJobs(data.results))
      .catch(() => {})
    api.get<any>('/reports/company/')
      .then(({ data }) => setAppCount(data?.totals?.applications ?? null))
      .catch(() => {})
  }, [user, profile])

  const startEdit = (section: string, initial: Record<string, any>) => {
    setDraft(initial)
    setEditing(section)
    setError('')
    setMsg('')
  }

  const patchJson = async (section: string, payload: Record<string, unknown>) => {
    setSaving(section)
    setError('')
    setMsg('')
    try {
      await api.patch('/auth/me/', payload)
      await refresh()
      setEditing(null)
      setMsg('Alterações salvas com sucesso.')
    } catch (err: any) {
      const data = err.response?.data
      setError(data?.detail ?? (data ? JSON.stringify(data) : 'Não foi possível salvar.'))
    } finally {
      setSaving('')
    }
  }

  const uploadFile = async (field: 'logo' | 'cover', file: File) => {
    setSaving(field)
    setError('')
    setMsg('')
    if (file.size > 5 * 1024 * 1024) {
      setError('O arquivo excede o tamanho máximo permitido de 5 MB.')
      setSaving('')
      return
    }
    const fd = new FormData()
    fd.append(field, file)
    try {
      const { data } = await api.patch<User>('/auth/me/', fd)
      updateUser(data)
      setMsg('Imagem atualizada.')
    } catch (err: any) {
      const errData = err.response?.data
      const firstFieldMsg =
        errData?.[field]?.[0] ??
        errData?.detail ??
        (errData && typeof errData === 'object' ? Object.values(errData).flat()[0] : null)
      setError(typeof firstFieldMsg === 'string' ? firstFieldMsg : 'Não foi possível enviar o arquivo.')
    } finally {
      setSaving('')
    }
  }

  if (!user) return <Spinner />

  const displayName = profile?.company_name || user.username
  const initials = displayName.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  const introDraft = () => ({
    first_name: user.first_name, last_name: user.last_name,
    phone: user.phone, city: user.city, email: user.email,
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <AreaHeader
        eyebrow="EMPRESA / PERFIL"
        title="Perfil da empresa"
        subtitle="Seu perfil público e as informações exibidas nas vagas publicadas."
        backTo="/company/dashboard"
        backLabel="Painel de vagas"
      />

      {/* ---- Profile hero: cover + logo + identity ------------------------- */}
      <div className="card overflow-hidden">
        <div className="relative h-44 bg-brand-600 sm:h-56">
          {profile?.cover_url && !coverError ? (
            <img
              src={profile.cover_url}
              alt="Capa"
              onError={() => setCoverError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10" />
              <div className="absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/10" />
            </>
          )}
          <button
            type="button"
            onClick={() => coverInput.current?.click()}
            disabled={saving === 'cover'}
            className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur transition-colors hover:bg-white"
          >
            {saving === 'cover' ? 'Enviando…' : 'Editar capa'}
          </button>
          <input
            ref={coverInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) uploadFile('cover', file)
            }}
          />
        </div>

        <div className="px-5 pb-6 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="relative -mt-14 sm:-mt-16">
              {profile?.logo_url && !logoError ? (
                <img
                  src={profile.logo_url}
                  alt={displayName}
                  onError={() => setLogoError(true)}
                  className="h-28 w-28 rounded-2xl border-4 border-white bg-white object-contain p-1 sm:h-32 sm:w-32"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-white bg-slate-100 sm:h-32 sm:w-32">
                  <span className="text-2xl font-extrabold text-slate-500">{initials}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => logoInput.current?.click()}
                disabled={saving === 'logo'}
                className="absolute -bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white shadow transition-colors hover:bg-brand-700"
                aria-label="Alterar logo"
                title="Alterar logo"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
              </button>
              <input
                ref={logoInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (file) uploadFile('logo', file)
                }}
              />
            </div>

            <div className="min-w-0 flex-1 pt-3">
              {editing === 'intro' ? (
                <div className="space-y-3">
                  <Field label="Nome fantasia">
                    <input className="input" value={draft.company_name ?? ''} onChange={(e) => setDraft({ ...draft, company_name: e.target.value })} />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Nome do responsável"><input className="input" value={draft.first_name ?? ''} onChange={(e) => setDraft({ ...draft, first_name: e.target.value })} /></Field>
                    <Field label="Sobrenome"><input className="input" value={draft.last_name ?? ''} onChange={(e) => setDraft({ ...draft, last_name: e.target.value })} /></Field>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="E-mail"><input className="input" type="email" value={draft.email ?? ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></Field>
                    <Field label="Telefone"><input className="input" value={draft.phone ?? ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></Field>
                  </div>
                  <Field label="Cidade"><input className="input" value={draft.city ?? ''} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></Field>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving === 'intro'}
                      onClick={() => patchJson('intro', {
                        company_name: draft.company_name, first_name: draft.first_name,
                        last_name: draft.last_name, email: draft.email,
                        phone: draft.phone, city: draft.city,
                      })}
                      className="btn-primary !py-2 text-xs"
                    >
                      {saving === 'intro' ? 'Salvando…' : 'Salvar'}
                    </button>
                    <button type="button" onClick={() => setEditing(null)} className="btn-ghost !py-2 text-xs">Cancelar</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{displayName}</h1>
                      <p className="mt-0.5 text-base text-slate-600">{profile?.sector || 'Adicione o setor da empresa'}</p>
                    </div>
                    <Pencil onClick={() => startEdit('intro', { ...introDraft(), company_name: profile?.company_name ?? '' })} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                    {(user.city || profile?.state) && <span>{[user.city, profile?.state].filter(Boolean).join(' · ')}</span>}
                    {profile?.size && <span>· {SIZE_OPTIONS.find(([v]) => v === profile.size)?.[1] ?? profile.size}</span>}
                    {profile?.website && (
                      <span>
                        · <a href={profile.website} target="_blank" rel="noreferrer" className="font-medium text-brand-600 hover:underline">{profile.website}</a>
                      </span>
                    )}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit('intro', { ...introDraft(), company_name: profile?.company_name ?? '' })}
                      className="btn-primary !py-2 text-xs"
                    >
                      Editar perfil
                    </button>
                    <Link to="/company/jobs/new" className="btn-outline !py-2 text-xs">Gerenciar vagas</Link>
                    <Link to={`/u/${user.username}`} className="btn-ghost !py-2 text-xs">Perfil público ↗</Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Highlighted hiring strip */}
        <div className="border-t border-slate-100 px-5 py-4 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Vagas ativas</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{jobs.length}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Candidaturas recebidas</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{appCount ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Setor</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{profile?.sector || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {msg && <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">{msg}</p>}
      {error && <div className="mt-4"><ErrorAlert message={error} /></div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          {/* ---- Sobre ----------------------------------------------------- */}
          <SectionShell
            title="Sobre a empresa"
            onEdit={editing === 'about' ? undefined : () => startEdit('about', { description: profile?.description ?? '' })}
          >
            {editing === 'about' ? (
              <div className="space-y-3">
                <Field label="Descrição da empresa">
                  <textarea
                    className="input min-h-32"
                    value={draft.description ?? ''}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    placeholder="Conte a história, a cultura e o que torna sua empresa especial…"
                  />
                </Field>
                <div className="flex gap-2">
                  <button type="button" disabled={saving === 'about'} onClick={() => patchJson('about', { description: draft.description })} className="btn-primary !py-2 text-xs">
                    {saving === 'about' ? 'Salvando…' : 'Salvar'}
                  </button>
                  <button type="button" onClick={() => setEditing(null)} className="btn-ghost !py-2 text-xs">Cancelar</button>
                </div>
              </div>
            ) : profile?.description ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{profile.description}</p>
            ) : (
              <p className="text-sm text-slate-400">Adicione uma descrição para atrair candidatos.</p>
            )}
          </SectionShell>

          {/* ---- Informações da empresa ------------------------------------- */}
          <SectionShell
            title="Informações da empresa"
            onEdit={editing === 'info' ? undefined : () => startEdit('info', {
              legal_name: profile?.legal_name ?? '', trade_name: profile?.trade_name ?? '',
              cnpj: profile?.cnpj ?? '', sector: profile?.sector ?? '',
              size: profile?.size ?? '', state: profile?.state ?? '',
            })}
          >
            {editing === 'info' ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Razão social"><input className="input" value={draft.legal_name ?? ''} onChange={(e) => setDraft({ ...draft, legal_name: e.target.value })} /></Field>
                  <Field label="Nome fantasia (trade)"><input className="input" value={draft.trade_name ?? ''} onChange={(e) => setDraft({ ...draft, trade_name: e.target.value })} /></Field>
                  <Field label="CNPJ"><input className="input" value={draft.cnpj ?? ''} onChange={(e) => setDraft({ ...draft, cnpj: e.target.value })} placeholder="00.000.000/0000-00" /></Field>
                  <Field label="Setor"><input className="input" value={draft.sector ?? ''} onChange={(e) => setDraft({ ...draft, sector: e.target.value })} /></Field>
                  <Field label="Tamanho">
                    <select className="input" value={draft.size ?? ''} onChange={(e) => setDraft({ ...draft, size: e.target.value })}>
                      <option value="">Selecione…</option>
                      {SIZE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </Field>
                  <Field label="Estado (UF)"><input className="input" maxLength={2} value={draft.state ?? ''} onChange={(e) => setDraft({ ...draft, state: e.target.value.toUpperCase() })} /></Field>
                </div>
                <div className="flex gap-2">
                  <button type="button" disabled={saving === 'info'} onClick={() => patchJson('info', {
                    legal_name: draft.legal_name, trade_name: draft.trade_name, cnpj: draft.cnpj,
                    sector: draft.sector, size: draft.size, state: draft.state,
                  })} className="btn-primary !py-2 text-xs">
                    {saving === 'info' ? 'Salvando…' : 'Salvar'}
                  </button>
                  <button type="button" onClick={() => setEditing(null)} className="btn-ghost !py-2 text-xs">Cancelar</button>
                </div>
              </div>
            ) : (
              <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                {[
                  ['Razão social', profile?.legal_name],
                  ['Nome fantasia (trade)', profile?.trade_name],
                  ['CNPJ', profile?.cnpj],
                  ['Setor', profile?.sector],
                  ['Tamanho', profile?.size ? SIZE_OPTIONS.find(([v]) => v === profile.size)?.[1] ?? profile.size : null],
                  ['Estado', profile?.state],
                ].map(([k, v]) => (
                  <div key={k} className="border-b border-slate-100 pb-2">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">{v || '—'}</dd>
                  </div>
                ))}
              </dl>
            )}
          </SectionShell>

          {/* ---- Contato ----------------------------------------------------- */}
          <SectionShell
            title="Contato"
            onEdit={editing === 'contact' ? undefined : () => startEdit('contact', {
              website: profile?.website ?? '', phone: user.phone, city: user.city, email: user.email,
            })}
          >
            {editing === 'contact' ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Site"><input className="input" placeholder="https://" value={draft.website ?? ''} onChange={(e) => setDraft({ ...draft, website: e.target.value })} /></Field>
                  <Field label="Telefone"><input className="input" value={draft.phone ?? ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></Field>
                  <Field label="Cidade"><input className="input" value={draft.city ?? ''} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></Field>
                  <Field label="E-mail"><input className="input" type="email" value={draft.email ?? ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></Field>
                </div>
                <div className="flex gap-2">
                  <button type="button" disabled={saving === 'contact'} onClick={() => patchJson('contact', {
                    website: draft.website, phone: draft.phone, city: draft.city, email: draft.email,
                  })} className="btn-primary !py-2 text-xs">
                    {saving === 'contact' ? 'Salvando…' : 'Salvar'}
                  </button>
                  <button type="button" onClick={() => setEditing(null)} className="btn-ghost !py-2 text-xs">Cancelar</button>
                </div>
              </div>
            ) : (
              <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <div className="border-b border-slate-100 pb-2">
                  <dt className="text-slate-500">Site</dt>
                  <dd className="mt-0.5 font-medium">
                    {profile?.website
                      ? <a href={profile.website} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">{profile.website}</a>
                      : '—'}
                  </dd>
                </div>
                <div className="border-b border-slate-100 pb-2"><dt className="text-slate-500">Telefone</dt><dd className="mt-0.5 font-medium text-slate-800">{user.phone || '—'}</dd></div>
                <div className="border-b border-slate-100 pb-2"><dt className="text-slate-500">Cidade</dt><dd className="mt-0.5 font-medium text-slate-800">{user.city || '—'}</dd></div>
                <div className="border-b border-slate-100 pb-2"><dt className="text-slate-500">E-mail</dt><dd className="mt-0.5 font-medium text-slate-800">{user.email}</dd></div>
              </dl>
            )}
          </SectionShell>

          {/* ---- Vagas abertas ------------------------------------------------ */}
          <SectionShell
            title="Vagas abertas"
            action={<Link to="/company/jobs/new" className="btn-outline !px-3 !py-1.5 text-xs">+ Publicar vaga</Link>}
          >
            {jobs.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhuma vaga publicada no momento.</p>
            ) : (
              <ul className="space-y-3">
                {jobs.map((j) => (
                  <li key={j.id}>
                    <Link to={`/jobs/${j.id}`} className="block rounded-xl border border-slate-200 p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/40">
                      <p className="font-semibold text-slate-900">{j.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {j.location} · {label(WORK_MODE_LABELS, j.work_mode)} · {label(JOB_TYPE_LABELS, j.job_type)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionShell>

          <PasswordSection />
        </div>

        {/* ---- Right sidebar ---------------------------------------------- */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-4">
            <p className="eyebrow mb-2">Perfil público</p>
            <p className="text-xs leading-relaxed text-slate-500">
              A página pública da empresa exibe descrição, vagas e informações de contato.
            </p>
            <Link to={`/u/${user.username}`} className="mt-2 inline-block text-xs font-semibold text-brand-600 hover:underline">
              Ver perfil público →
            </Link>
          </div>

          <div className="card p-4">
            <p className="eyebrow mb-2">Seu painel</p>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Vagas ativas</dt><dd className="font-bold text-slate-900">{jobs.length}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Candidaturas</dt><dd className="font-bold text-slate-900">{appCount ?? '—'}</dd></div>
            </dl>
          </div>

          <div className="card p-4">
            <p className="eyebrow mb-2">Atalhos</p>
            <div className="space-y-1 text-sm">
              <Link to="/company/jobs/new" className="block font-medium text-slate-600 hover:text-brand-600">Publicar vaga</Link>
              <Link to="/company/dashboard" className="block font-medium text-slate-600 hover:text-brand-600">Painel de vagas</Link>
              <Link to="/company/applications" className="block font-medium text-slate-600 hover:text-brand-600">Candidaturas</Link>
              <Link to="/company/matching" className="block font-medium text-slate-600 hover:text-brand-600">Matching de candidatos</Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
