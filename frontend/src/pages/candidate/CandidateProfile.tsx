import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import type { EducationEntry, ExperienceEntry, Skill } from '../../types'
import { ErrorAlert, Field, Spinner } from '../../components/ui'
import { PasswordSection } from '../../components/PasswordSection'
import { CATEGORY_LABELS, EDUCATION_STATUS_LABELS, WORK_MODE_LABELS, label } from '../../lib/labels'

const EMPTY_EXP: Omit<ExperienceEntry, 'id'> = {
  role: '', company: '', start: '', end: '', is_current: false, description: '',
}
const EMPTY_EDU: Omit<EducationEntry, 'id'> = {
  course: '', institution: '', status: 'in_progress', year: null,
}

export function CandidateProfile() {
  const { user, refresh } = useAuth()
  const [skills, setSkills] = useState<Skill[]>([])
  const [selectedSkills, setSelectedSkills] = useState<number[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', city: '',
    headline: '', bio: '', education: '', experience_years: 0,
    preferred_category: '', preferred_location: '',
  })
  const [workModes, setWorkModes] = useState<string[]>([])
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([])
  const [educations, setEducations] = useState<EducationEntry[]>([])
  const [expForm, setExpForm] = useState<Partial<ExperienceEntry> | null>(null)
  const [eduForm, setEduForm] = useState<Partial<EducationEntry> | null>(null)
  const [resume, setResume] = useState<File | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    const p = user.candidate_profile
    setForm({
      first_name: user.first_name, last_name: user.last_name, email: user.email,
      phone: user.phone, city: user.city,
      headline: p?.headline ?? '', bio: p?.bio ?? '', education: p?.education ?? '',
      experience_years: p?.experience_years ?? 0,
      preferred_category: p?.preferred_category ?? '',
      preferred_location: p?.preferred_location ?? '',
    })
    setWorkModes(p?.preferred_work_modes ?? [])
    setSelectedSkills(p?.skills.map((s) => s.id) ?? [])
    setExperiences(p?.experiences ?? [])
    setEducations(p?.educations ?? [])
    api.get<Skill[]>('/skills/').then(({ data }) => setSkills(data)).catch(() => {})
    setLoading(false)
  }, [user])

  const toggleSkill = (id: number) =>
    setSelectedSkills((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const toggleWorkMode = (mode: string) =>
    setWorkModes((m) => (m.includes(mode) ? m.filter((x) => x !== mode) : [...m, mode]))

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

  // ---- Experience / education entry helpers -------------------------------
  const saveEntry = async (kind: 'experiences' | 'education') => {
    const isExp = kind === 'experiences'
    const editing = isExp ? expForm?.id : eduForm?.id
    const payload = isExp ? expForm : eduForm
    if (!payload) return
    try {
      if (editing) {
        const { data } = await api.patch(`/${kind}/${editing}/`, payload)
        if (isExp) setExperiences((list) => list.map((e) => (e.id === editing ? data : e)))
        else setEducations((list) => list.map((e) => (e.id === editing ? data : e)))
      } else {
        const { data } = await api.post(`/${kind}/`, payload)
        if (isExp) setExperiences((list) => [data, ...list])
        else setEducations((list) => [data, ...list])
      }
      if (isExp) setExpForm(null)
      else setEduForm(null)
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Erro ao salvar entrada.')
    }
  }

  const deleteEntry = async (kind: 'experiences' | 'education', id: number) => {
    await api.delete(`/${kind}/${id}/`).catch(() => {})
    if (kind === 'experiences') setExperiences((list) => list.filter((e) => e.id !== id))
    else setEducations((list) => list.filter((e) => e.id !== id))
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    setError('')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
    selectedSkills.forEach((id) => fd.append('skills', String(id)))
    workModes.forEach((m) => fd.append('preferred_work_modes', m))
    if (resume) fd.append('resume', resume)
    if (photo) fd.append('photo', photo)
    try {
      await api.patch('/auth/me/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await refresh()
      setMsg('Perfil salvo com sucesso.')
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Não foi possível salvar o perfil.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  const profile = user?.candidate_profile

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Meu perfil</h1>
      <p className="mt-1 text-sm text-slate-500">Mantenha suas informações atualizadas para melhorar seus matches.</p>

      <form onSubmit={save} className="mt-6 space-y-6">
        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Informações pessoais</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome"><input className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
            <Field label="Sobrenome"><input className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
            <Field label="E-mail"><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Telefone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Cidade"><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          </div>
          {profile?.photo_url && (
            <img src={profile.photo_url} alt="Perfil" className="mt-4 h-20 w-20 rounded-full object-cover ring-2 ring-brand-200" />
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Foto de perfil">
              <input type="file" accept="image/*" className="input !py-2 text-xs" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
            </Field>
            <Field label="Currículo (PDF/DOCX, até 5 MB)">
              <input type="file" accept=".pdf,.doc,.docx" className="input !py-2 text-xs" onChange={(e) => setResume(e.target.files?.[0] ?? null)} />
              {profile?.resume_url && <a href={profile.resume_url} target="_blank" rel="noreferrer" className="text-xs text-brand-600 underline">Currículo atual</a>}
            </Field>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Perfil profissional</h2>
          <div className="grid gap-4">
            <Field label="Título profissional"><input className="input" placeholder="Ex.: Desenvolvedor(a) Front-End" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Formação"><input className="input" value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} /></Field>
              <Field label="Anos de experiência"><input className="input" type="number" min={0} value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: Number(e.target.value) })} /></Field>
            </div>
            <Field label="Sobre você"><textarea className="input min-h-28" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Resumo profissional, projetos, objetivos…" /></Field>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Preferências de trabalho</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Área de interesse">
              <select className="input" value={form.preferred_category} onChange={(e) => setForm({ ...form, preferred_category: e.target.value })}>
                <option value="">Qualquer área</option>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="Localização preferida">
              <input className="input" value={form.preferred_location} onChange={(e) => setForm({ ...form, preferred_location: e.target.value })} placeholder="Ex.: São Paulo" />
            </Field>
          </div>
          <Field label="Modelo de trabalho preferido">
            <div className="flex flex-wrap gap-2 pt-1">
              {Object.entries(WORK_MODE_LABELS).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleWorkMode(v)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors ${
                    workModes.includes(v)
                      ? 'bg-brand-600 text-white ring-brand-600'
                      : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* Experiences */}
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Experiências profissionais</h2>
            <button type="button" className="btn-outline !py-1.5 text-xs" onClick={() => setExpForm({ ...EMPTY_EXP })}>
              + Adicionar
            </button>
          </div>
          {experiences.length === 0 && <p className="text-sm text-slate-400">Nenhuma experiência cadastrada.</p>}
          <ul className="space-y-3">
            {experiences.map((e) => (
              <li key={e.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{e.role} — {e.company}</p>
                    <p className="text-xs text-slate-500">
                      {e.start}{e.end ? ` a ${e.end}` : e.is_current ? ' — atual' : ''}
                    </p>
                    {e.description && <p className="mt-1 text-sm text-slate-600">{e.description}</p>}
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button type="button" className="text-brand-600 hover:underline" onClick={() => setExpForm({ ...e })}>Editar</button>
                    <button type="button" className="text-red-500 hover:underline" onClick={() => deleteEntry('experiences', e.id)}>Excluir</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
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
        </div>

        {/* Education */}
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Formação</h2>
            <button type="button" className="btn-outline !py-1.5 text-xs" onClick={() => setEduForm({ ...EMPTY_EDU })}>
              + Adicionar
            </button>
          </div>
          {educations.length === 0 && <p className="text-sm text-slate-400">Nenhuma formação cadastrada.</p>}
          <ul className="space-y-3">
            {educations.map((e) => (
              <li key={e.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{e.course} — {e.institution}</p>
                    <p className="text-xs text-slate-500">
                      {label(EDUCATION_STATUS_LABELS, e.status)}{e.year ? ` · ${e.year}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button type="button" className="text-brand-600 hover:underline" onClick={() => setEduForm({ ...e })}>Editar</button>
                    <button type="button" className="text-red-500 hover:underline" onClick={() => deleteEntry('education', e.id)}>Excluir</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
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
        </div>

        {/* Skills */}
        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Habilidades</h2>
          <div className="flex flex-wrap gap-2">
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
          <div className="mt-3 flex gap-2">
            <input className="input" placeholder="Adicionar nova habilidade…" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
            <button type="button" onClick={addSkill} className="btn-outline">Adicionar</button>
          </div>
        </div>

        {msg && <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">{msg}</p>}
        {error && <ErrorAlert message={error} />}
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Salvando…' : 'Salvar perfil'}
        </button>
      </form>

      <div className="mt-6">
        <PasswordSection />
      </div>
    </div>
  )
}
