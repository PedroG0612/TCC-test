import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import type { EducationEntry, ExperienceEntry, Skill } from '../../types'
import { ErrorAlert, Field, Spinner } from '../../components/ui'
import { PasswordSection } from '../../components/PasswordSection'
import { AreaHeader } from '../../components/figma'
import {
  CATEGORY_LABELS, EDUCATION_STATUS_LABELS, WORK_MODE_LABELS, label,
} from '../../lib/labels'

const EMPTY_EXP: Omit<ExperienceEntry, 'id'> = {
  role: '', company: '', start: '', end: '', is_current: false, description: '',
}
const EMPTY_EDU: Omit<EducationEntry, 'id'> = {
  course: '', institution: '', status: 'in_progress', year: null,
}

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

export function CandidateProfile() {
  const { user, refresh } = useAuth()
  const profile = user?.candidate_profile

  const [skills, setSkills] = useState<Skill[]>([])
  const [selectedSkills, setSelectedSkills] = useState<number[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([])
  const [educations, setEducations] = useState<EducationEntry[]>([])
  const [expForm, setExpForm] = useState<Partial<ExperienceEntry> | null>(null)
  const [eduForm, setEduForm] = useState<Partial<EducationEntry> | null>(null)

  // Per-section editing state
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [appCount, setAppCount] = useState<number | null>(null)
  const coverInput = useRef<HTMLInputElement>(null)
  const photoInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    const p = user.candidate_profile
    setSelectedSkills(p?.skills.map((s) => s.id) ?? [])
    setExperiences(p?.experiences ?? [])
    setEducations(p?.educations ?? [])
    api.get<Skill[]>('/skills/').then(({ data }) => setSkills(data)).catch(() => {})
    api.get<{ count: number }>('/applications/', { params: { page_size: 1 } })
      .then(({ data }) => setAppCount(data.count)).catch(() => {})
  }, [user])

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

  const uploadFile = async (field: 'photo' | 'cover' | 'resume', file: File) => {
    setSaving(field)
    setError('')
    const fd = new FormData()
    fd.append(field, file)
    try {
      await api.patch('/auth/me/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await refresh()
      setMsg(field === 'resume' ? 'Currículo enviado.' : 'Imagem atualizada.')
      if (field === 'resume') setResumeFile(null)
    } catch {
      setError('Não foi possível enviar o arquivo.')
    } finally {
      setSaving('')
    }
  }

  // ---- Skills -------------------------------------------------------------
  const toggleSkill = (id: number) =>
    setSelectedSkills((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const saveSkills = () => patchJson('skills', { skills: selectedSkills })

  const addSkill = async () => {
    const name = skillInput.trim()
    if (!name) return
    try {
      const { data } = await api.post<Skill>('/skills/', { name })
      setSkills((s) => [...s, data].sort((a, b) => a.name.localeCompare(b.name)))
      setSelectedSkills((s) => [...s, data.id])
      setSkillInput('')
    } catch {
      const existing = skills.find((s) => s.name.toLowerCase() === name.toLowerCase())
      if (existing) {
        setSelectedSkills((s) => [...s, existing.id])
        setSkillInput('')
      }
    }
  }

  // ---- Experience / education entries --------------------------------------
  const saveEntry = async (kind: 'experiences' | 'education') => {
    const isExp = kind === 'experiences'
    const editingEntry = isExp ? expForm?.id : eduForm?.id
    const payload = isExp ? expForm : eduForm
    if (!payload) return
    setSaving(kind)
    setError('')
    try {
      if (editingEntry) {
        const { data } = await api.patch(`/${kind}/${editingEntry}/`, payload)
        if (isExp) setExperiences((list) => list.map((e) => (e.id === editingEntry ? data : e)))
        else setEducations((list) => list.map((e) => (e.id === editingEntry ? data : e)))
      } else {
        const { data } = await api.post(`/${kind}/`, payload)
        if (isExp) setExperiences((list) => [data, ...list])
        else setEducations((list) => [data, ...list])
      }
      if (isExp) setExpForm(null)
      else setEduForm(null)
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Erro ao salvar entrada.')
    } finally {
      setSaving('')
    }
  }

  const deleteEntry = async (kind: 'experiences' | 'education', id: number) => {
    await api.delete(`/${kind}/${id}/`).catch(() => {})
    if (kind === 'experiences') setExperiences((list) => list.filter((e) => e.id !== id))
    else setEducations((list) => list.filter((e) => e.id !== id))
  }

  const toggleWorkMode = (mode: string, current: string[]) =>
    current.includes(mode) ? current.filter((x) => x !== mode) : [...current, mode]

  if (!user) return <Spinner />

  const fullName = `${user.first_name} ${user.last_name}`.trim() || user.username
  const initials = fullName.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <AreaHeader
        eyebrow="CANDIDATO / PERFIL"
        title="Meu perfil"
        subtitle="Seu perfil profissional — visível para as empresas nas vagas em que você se candidatar."
        backTo="/applications"
        backLabel="Voltar às candidaturas"
      />

      {/* ---- Profile hero (LinkedIn-style): cover + avatar + identity ------- */}
      <div className="card overflow-hidden">
        <div className="relative h-44 bg-brand-600 sm:h-56">
          {profile?.cover_url && (
            <img src={profile.cover_url} alt="Capa" className="h-full w-full object-cover" />
          )}
          {!profile?.cover_url && (
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
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadFile('cover', e.target.files[0])}
          />
        </div>

        <div className="px-5 pb-6 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="relative -mt-14 sm:-mt-16">
              <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-brand-100 sm:h-32 sm:w-32">
                {profile?.photo_url ? (
                  <img src={profile.photo_url} alt={fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-brand-700">{initials}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => photoInput.current?.click()}
                disabled={saving === 'photo'}
                className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white shadow transition-colors hover:bg-brand-700"
                aria-label="Alterar foto"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              </button>
              <input
                ref={photoInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadFile('photo', e.target.files[0])}
              />
            </div>

            <div className="min-w-0 flex-1 pt-3">
              {editing === 'intro' ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Nome"><input className="input" value={draft.first_name ?? ''} onChange={(e) => setDraft({ ...draft, first_name: e.target.value })} /></Field>
                    <Field label="Sobrenome"><input className="input" value={draft.last_name ?? ''} onChange={(e) => setDraft({ ...draft, last_name: e.target.value })} /></Field>
                  </div>
                  <Field label="Título profissional"><input className="input" value={draft.headline ?? ''} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} placeholder="Ex.: Desenvolvedor(a) Full Stack" /></Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Cidade"><input className="input" value={draft.city ?? ''} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></Field>
                    <Field label="Telefone"><input className="input" value={draft.phone ?? ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></Field>
                  </div>
                  <Field label="E-mail"><input className="input" type="email" value={draft.email ?? ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Formação (resumo)"><input className="input" value={draft.education ?? ''} onChange={(e) => setDraft({ ...draft, education: e.target.value })} placeholder="Ex.: ADS — SENAI" /></Field>
                    <Field label="Anos de experiência">
                      <input className="input" type="number" min={0} value={draft.experience_years ?? 0} onChange={(e) => setDraft({ ...draft, experience_years: Number(e.target.value) })} />
                    </Field>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving === 'intro'}
                      onClick={() => patchJson('intro', {
                        first_name: draft.first_name, last_name: draft.last_name,
                        headline: draft.headline, city: draft.city,
                        phone: draft.phone, email: draft.email,
                        education: draft.education, experience_years: Number(draft.experience_years ?? 0),
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
                      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{fullName}</h1>
                      <p className="mt-0.5 text-base text-slate-600">{profile?.headline || 'Adicione um título profissional'}</p>
                    </div>
                    <Pencil onClick={() => startEdit('intro', {
                      first_name: user.first_name, last_name: user.last_name,
                      headline: profile?.headline ?? '', city: user.city,
                      phone: user.phone, email: user.email,
                      education: profile?.education ?? '', experience_years: profile?.experience_years ?? 0,
                    })} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                    {user.city && <span>📍 {user.city}</span>}
                    {profile?.experience_years ? <span>· {profile.experience_years} ano(s) de experiência</span> : null}
                    <span>· {user.email}</span>
                    {user.phone && <span>· {user.phone}</span>}
                  </div>
                  {profile?.education && (
                    <p className="mt-1 text-sm text-slate-500">Formação: {profile.education}</p>
                  )}
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit('intro', {
                        first_name: user.first_name, last_name: user.last_name,
                        headline: profile?.headline ?? '', city: user.city,
                        phone: user.phone, email: user.email,
                        education: profile?.education ?? '', experience_years: profile?.experience_years ?? 0,
                      })}
                      className="btn-primary !py-2 text-xs"
                    >
                      Editar perfil
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpForm({ ...EMPTY_EXP })}
                      className="btn-outline !py-2 text-xs"
                    >
                      Adicionar seção
                    </button>
                    <Link to="/jobs" className="btn-outline !py-2 text-xs">Melhorar perfil</Link>
                    <Link to={`/u/${user.username}`} className="btn-ghost !py-2 text-xs">Perfil público ↗</Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Highlighted preferences strip */}
        <div className="border-t border-slate-100 px-5 py-4 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Área de interesse</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {profile?.preferred_category ? label(CATEGORY_LABELS, profile.preferred_category) : 'Não definida'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Localização preferida</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{profile?.preferred_location || 'Qualquer'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Modelo de trabalho</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {profile?.preferred_work_modes?.length
                  ? profile.preferred_work_modes.map((m) => label(WORK_MODE_LABELS, m)).join(', ')
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {msg && <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">{msg}</p>}
      {error && <div className="mt-4"><ErrorAlert message={error} /></div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
        {/* ---- Sobre ------------------------------------------------------ */}
        <SectionShell
          title="Sobre"
          onEdit={editing === 'about' ? undefined : () => startEdit('about', { bio: profile?.bio ?? '' })}
        >
          {editing === 'about' ? (
            <div className="space-y-3">
              <Field label="Resumo profissional">
                <textarea
                  className="input min-h-32"
                  value={draft.bio ?? ''}
                  onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                  placeholder="Conte sua trajetória, projetos e o que você procura…"
                />
              </Field>
              <div className="flex gap-2">
                <button type="button" disabled={saving === 'about'} onClick={() => patchJson('about', { bio: draft.bio })} className="btn-primary !py-2 text-xs">
                  {saving === 'about' ? 'Salvando…' : 'Salvar'}
                </button>
                <button type="button" onClick={() => setEditing(null)} className="btn-ghost !py-2 text-xs">Cancelar</button>
              </div>
            </div>
          ) : profile?.bio ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{profile.bio}</p>
          ) : (
            <p className="text-sm text-slate-400">Adicione um resumo para se apresentar às empresas.</p>
          )}
        </SectionShell>

        {/* ---- Experiência ----------------------------------------------- */}
        <SectionShell
          title="Experiência"
          action={
            <button type="button" className="btn-outline !px-3 !py-1.5 text-xs" onClick={() => setExpForm({ ...EMPTY_EXP })}>
              + Adicionar
            </button>
          }
        >
          {experiences.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma experiência cadastrada.</p>
          ) : (
            <ul className="space-y-4">
              {experiences.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-slate-900">{e.role}</p>
                    <p className="text-sm text-slate-500">{e.company}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {e.start}{e.end ? ` – ${e.end}` : e.is_current ? ' – atual' : ''}
                    </p>
                    {e.description && <p className="mt-1.5 text-sm text-slate-600">{e.description}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2 text-xs">
                    <button type="button" className="text-brand-600 hover:underline" onClick={() => setExpForm({ ...e })}>Editar</button>
                    <button type="button" className="text-red-500 hover:underline" onClick={() => deleteEntry('experiences', e.id)}>Excluir</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {expForm && (
            <div className="mt-4 space-y-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Cargo"><input className="input" value={expForm.role ?? ''} onChange={(e) => setExpForm({ ...expForm, role: e.target.value })} /></Field>
                <Field label="Empresa"><input className="input" value={expForm.company ?? ''} onChange={(e) => setExpForm({ ...expForm, company: e.target.value })} /></Field>
                <Field label="Início"><input className="input" placeholder="Ex.: 2023-01" value={expForm.start ?? ''} onChange={(e) => setExpForm({ ...expForm, start: e.target.value })} /></Field>
                <Field label="Fim"><input className="input" placeholder="Ex.: 2024-06" value={expForm.end ?? ''} onChange={(e) => setExpForm({ ...expForm, end: e.target.value })} disabled={expForm.is_current} /></Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={!!expForm.is_current} onChange={(e) => setExpForm({ ...expForm, is_current: e.target.checked })} />
                Trabalho atual
              </label>
              <Field label="Descrição das atividades/resultados">
                <textarea className="input min-h-20" value={expForm.description ?? ''} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} />
              </Field>
              <div className="flex gap-2">
                <button type="button" className="btn-primary !py-2 text-xs" onClick={() => saveEntry('experiences')}>Salvar experiência</button>
                <button type="button" className="btn-ghost !py-2 text-xs" onClick={() => setExpForm(null)}>Cancelar</button>
              </div>
            </div>
          )}
        </SectionShell>

        {/* ---- Formação ---------------------------------------------------- */}
        <SectionShell
          title="Formação"
          action={
            <button type="button" className="btn-outline !px-3 !py-1.5 text-xs" onClick={() => setEduForm({ ...EMPTY_EDU })}>
              + Adicionar
            </button>
          }
        >
          {educations.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma formação cadastrada.</p>
          ) : (
            <ul className="space-y-4">
              {educations.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-slate-900">{e.course}</p>
                    <p className="text-sm text-slate-500">{e.institution}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {label(EDUCATION_STATUS_LABELS, e.status)}{e.year ? ` · ${e.year}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2 text-xs">
                    <button type="button" className="text-brand-600 hover:underline" onClick={() => setEduForm({ ...e })}>Editar</button>
                    <button type="button" className="text-red-500 hover:underline" onClick={() => deleteEntry('education', e.id)}>Excluir</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {eduForm && (
            <div className="mt-4 space-y-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Curso"><input className="input" value={eduForm.course ?? ''} onChange={(e) => setEduForm({ ...eduForm, course: e.target.value })} /></Field>
                <Field label="Instituição"><input className="input" value={eduForm.institution ?? ''} onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })} /></Field>
                <Field label="Status">
                  <select className="input" value={eduForm.status ?? 'in_progress'} onChange={(e) => setEduForm({ ...eduForm, status: e.target.value as EducationEntry['status'] })}>
                    {Object.entries(EDUCATION_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </Field>
                <Field label="Ano de conclusão"><input className="input" type="number" value={eduForm.year ?? ''} onChange={(e) => setEduForm({ ...eduForm, year: e.target.value ? Number(e.target.value) : null })} /></Field>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-primary !py-2 text-xs" onClick={() => saveEntry('education')}>Salvar formação</button>
                <button type="button" className="btn-ghost !py-2 text-xs" onClick={() => setEduForm(null)}>Cancelar</button>
              </div>
            </div>
          )}
        </SectionShell>

        {/* ---- Competências ------------------------------------------------ */}
        <SectionShell
          title="Competências"
          onEdit={undefined}
          action={
            <div className="flex items-center gap-2">
              <input
                className="input !w-44 !py-1.5 text-xs"
                placeholder="Adicionar habilidade…"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <button type="button" onClick={addSkill} className="btn-outline !px-3 !py-1.5 text-xs">Adicionar</button>
            </div>
          }
        >
          <div className="flex flex-wrap gap-2">
            {skills.filter((s) => selectedSkills.includes(s.id)).map((s) => (
              <span key={s.id} className="badge bg-brand-50 px-3 py-1.5 text-sm text-brand-700 ring-1 ring-inset ring-brand-200">
                {s.name}
                <button type="button" className="ml-1.5 text-brand-400 hover:text-red-500" onClick={() => toggleSkill(s.id)} aria-label={`Remover ${s.name}`}>×</button>
              </span>
            ))}
            {selectedSkills.length === 0 && <p className="text-sm text-slate-400">Nenhuma competência selecionada.</p>}
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" disabled={saving === 'skills'} onClick={saveSkills} className="btn-primary !py-2 text-xs">
              {saving === 'skills' ? 'Salvando…' : 'Salvar competências'}
            </button>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-brand-600">Gerenciar lista de habilidades</summary>
            <div className="mt-2 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
              {skills.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSkill(s.id)}
                  className={`badge px-3 py-1.5 text-sm ring-1 ring-inset transition-colors ${
                    selectedSkills.includes(s.id)
                      ? 'bg-brand-600 text-white ring-brand-600'
                      : 'bg-slate-100 text-slate-600 ring-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </details>
        </SectionShell>

        {/* ---- Certificações ----------------------------------------------- */}
        <SectionShell
          title="Certificações"
          onEdit={editing === 'certs' ? undefined : () => startEdit('certs', { certifications: profile?.certifications ?? '' })}
        >
          {editing === 'certs' ? (
            <div className="space-y-3">
              <Field label="Certificados e qualificações (um por linha)">
                <textarea
                  className="input min-h-28"
                  value={draft.certifications ?? ''}
                  onChange={(e) => setDraft({ ...draft, certifications: e.target.value })}
                  placeholder={'Ex.:\nAWS Certified Cloud Practitioner — 2024\nScrum Fundamentals — 2023'}
                />
              </Field>
              <div className="flex gap-2">
                <button type="button" disabled={saving === 'certs'} onClick={() => patchJson('certs', { certifications: draft.certifications })} className="btn-primary !py-2 text-xs">
                  {saving === 'certs' ? 'Salvando…' : 'Salvar'}
                </button>
                <button type="button" onClick={() => setEditing(null)} className="btn-ghost !py-2 text-xs">Cancelar</button>
              </div>
            </div>
          ) : (profile?.certifications ?? '').split('\n').filter((s) => s.trim()).length > 0 ? (
            <ul className="list-inside list-disc space-y-1.5 text-sm text-slate-600">
              {(profile?.certifications ?? '').split('\n').map((s) => s.trim()).filter(Boolean).map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Nenhuma certificação cadastrada.</p>
          )}
        </SectionShell>

        {/* ---- Preferências ------------------------------------------------ */}
        <SectionShell
          title="Preferências de trabalho"
          onEdit={editing === 'prefs' ? undefined : () => startEdit('prefs', {
            preferred_category: profile?.preferred_category ?? '',
            preferred_location: profile?.preferred_location ?? '',
            preferred_work_modes: profile?.preferred_work_modes ?? [],
          })}
        >
          {editing === 'prefs' ? (
            <div className="space-y-4">
              <Field label="Área de interesse">
                <select className="input" value={draft.preferred_category ?? ''} onChange={(e) => setDraft({ ...draft, preferred_category: e.target.value })}>
                  <option value="">Qualquer área</option>
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Localização preferida">
                <input className="input" value={draft.preferred_location ?? ''} onChange={(e) => setDraft({ ...draft, preferred_location: e.target.value })} placeholder="Ex.: São Paulo, remoto" />
              </Field>
              <div>
                <span className="mb-2 block text-sm font-medium text-slate-700">Modelo de trabalho preferido</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(WORK_MODE_LABELS).map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDraft({ ...draft, preferred_work_modes: toggleWorkMode(v, draft.preferred_work_modes ?? []) })}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                        (draft.preferred_work_modes ?? []).includes(v)
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-slate-300 text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" disabled={saving === 'prefs'} onClick={() => patchJson('prefs', {
                  preferred_category: draft.preferred_category,
                  preferred_location: draft.preferred_location,
                  preferred_work_modes: draft.preferred_work_modes ?? [],
                })} className="btn-primary !py-2 text-xs">
                  {saving === 'prefs' ? 'Salvando…' : 'Salvar'}
                </button>
                <button type="button" onClick={() => setEditing(null)} className="btn-ghost !py-2 text-xs">Cancelar</button>
              </div>
            </div>
          ) : (
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-3 border-b border-slate-100 py-2 sm:block">
                <dt className="text-slate-500">Área de interesse</dt>
                <dd className="font-medium text-slate-800 sm:mt-0.5">{profile?.preferred_category ? label(CATEGORY_LABELS, profile.preferred_category) : '—'}</dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-slate-100 py-2 sm:block">
                <dt className="text-slate-500">Localização preferida</dt>
                <dd className="font-medium text-slate-800 sm:mt-0.5">{profile?.preferred_location || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-slate-100 py-2 sm:col-span-2 sm:block">
                <dt className="text-slate-500">Modelo de trabalho</dt>
                <dd className="font-medium text-slate-800 sm:mt-0.5">
                  {profile?.preferred_work_modes?.length
                    ? profile.preferred_work_modes.map((m) => label(WORK_MODE_LABELS, m)).join(', ')
                    : '—'}
                </dd>
              </div>
            </dl>
          )}
        </SectionShell>

        {/* ---- Currículo --------------------------------------------------- */}
        <SectionShell
          title="Currículo"
          onEdit={undefined}
          action={
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                id="resume-input"
                onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              />
              <label htmlFor="resume-input" className="btn-outline !px-3 !py-1.5 text-xs cursor-pointer">
                {resumeFile ? resumeFile.name : 'Enviar arquivo'}
              </label>
              {resumeFile && (
                <button type="button" disabled={saving === 'resume'} onClick={() => uploadFile('resume', resumeFile)} className="btn-primary !px-3 !py-1.5 text-xs">
                  {saving === 'resume' ? 'Enviando…' : 'Salvar'}
                </button>
              )}
            </div>
          }
        >
          {profile?.resume_url ? (
            <a href={profile.resume_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline">
              📄 Ver currículo atual
            </a>
          ) : (
            <p className="text-sm text-slate-400">Nenhum currículo enviado. Formatos: PDF, DOC ou DOCX (até 5 MB).</p>
          )}
        </SectionShell>

        <PasswordSection />
        </div>

        {/* ---- Right sidebar ---------------------------------------------- */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-4">
            <p className="eyebrow mb-2">Perfil público</p>
            <p className="text-xs leading-relaxed text-slate-500">
              Seu perfil profissional é visível para empresas nas candidaturas que você enviar.
            </p>
            <Link to={`/u/${user.username}`} className="mt-2 inline-block text-xs font-semibold text-brand-600 hover:underline">
              Ver perfil público →
            </Link>
          </div>

          <div className="card p-4">
            <p className="eyebrow mb-2">Seu painel</p>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Candidaturas</dt><dd className="font-bold text-slate-900">{appCount ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Competências</dt><dd className="font-bold text-slate-900">{profile?.skills.length ?? 0}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Experiências</dt><dd className="font-bold text-slate-900">{experiences.length}</dd></div>
            </dl>
          </div>

          <div className="card p-4">
            <p className="eyebrow mb-2">Atalhos</p>
            <div className="space-y-1 text-sm">
              <Link to="/jobs" className="block font-medium text-slate-600 hover:text-brand-600">Buscar vagas</Link>
              <Link to="/applications" className="block font-medium text-slate-600 hover:text-brand-600">Minhas candidaturas</Link>
              <Link to="/jobs" className="block font-medium text-slate-600 hover:text-brand-600">Vagas para meu perfil</Link>
            </div>
          </div>
        </aside>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        <Link to="/jobs" className="font-semibold text-brand-600 hover:underline">Ver vagas para meu perfil →</Link>
      </p>
    </div>
  )
}
