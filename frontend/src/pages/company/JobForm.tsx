import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/api'
import type { Job, Skill } from '../../types'
import { ErrorAlert, Field, Spinner } from '../../components/ui'
import {
  CATEGORY_LABELS, JOB_STATUS_LABELS, JOB_TYPE_LABELS, SENIORITY_LABELS,
  WORK_MODE_LABELS, label,
} from '../../lib/labels'

const STEPS = ['Dados da vaga', 'Requisitos e matching', 'Revisão']

interface FormState {
  title: string
  description: string
  responsibilities: string
  requirements: string
  category: string
  location: string
  work_mode: string
  job_type: string
  seniority: string
  contract_type: string
  salary_min: string
  salary_max: string
  currency: string
  status: string
}

export function JobForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [skills, setSkills] = useState<Skill[]>([])
  const [essentialIds, setEssentialIds] = useState<number[]>([])
  const [desiredIds, setDesiredIds] = useState<number[]>([])
  const [form, setForm] = useState<FormState>({
    title: '', description: '', responsibilities: '', requirements: '',
    category: 'technology', location: '', work_mode: 'onsite',
    job_type: 'full_time', seniority: 'pleno', contract_type: '',
    salary_min: '', salary_max: '', currency: 'BRL', status: 'draft',
  })
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Skill[]>('/skills/').then(({ data }) => setSkills(data)).catch(() => {})
    if (isEdit) {
      api.get<Job>(`/jobs/${id}/`).then(({ data }) => {
        setForm({
          title: data.title, description: data.description,
          responsibilities: data.responsibilities ?? '', requirements: data.requirements,
          category: data.category, location: data.location, work_mode: data.work_mode,
          job_type: data.job_type, seniority: data.seniority ?? 'pleno',
          contract_type: data.contract_type ?? '',
          salary_min: data.salary_min ?? '', salary_max: data.salary_max ?? '',
          currency: data.currency, status: data.status,
        })
        setEssentialIds(data.essential_skills.map((s) => s.id))
        setDesiredIds(data.desired_skills.map((s) => s.id))
      }).finally(() => setLoading(false))
    }
  }, [id, isEdit])

  const toggle = (list: number[], setList: (v: number[]) => void, sid: number) =>
    setList(list.includes(sid) ? list.filter((x) => x !== sid) : [...list, sid])

  const stepValid = () => {
    if (step === 0) return !!form.title && !!form.description && !!form.location
    return true
  }

  const save = async (statusOverride?: string) => {
    setSaving(true)
    setErrors({})
    setError('')
    const payload: Record<string, unknown> = {
      ...form,
      status: statusOverride ?? form.status,
      salary_min: form.salary_min || null,
      salary_max: form.salary_max || null,
      essential_skill_ids: essentialIds,
      desired_skill_ids: desiredIds,
    }
    try {
      if (isEdit) {
        await api.patch(`/jobs/${id}/`, payload)
      } else {
        await api.post('/jobs/', payload)
      }
      navigate('/company/jobs')
    } catch (err: any) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const flat: Record<string, string> = {}
        for (const [k, v] of Object.entries(data)) flat[k] = Array.isArray(v) ? String(v[0]) : String(v)
        setErrors(flat)
      }
      setError('Não foi possível salvar a vaga. Revise o formulário.')
      setSaving(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await save()
  }

  if (loading) return <Spinner />

  const skillChip = (sid: number, selected: number[], setSel: (v: number[]) => void, activeCls: string) => (
    <button
      key={sid}
      type="button"
      onClick={() => toggle(selected, setSel, sid)}
      className={`badge px-3 py-1.5 text-sm ring-1 ring-inset transition-colors ${
        selected.includes(sid)
          ? activeCls
          : 'bg-slate-100 text-slate-600 ring-slate-200 hover:bg-slate-200'
      }`}
    >
      {skills.find((s) => s.id === sid)?.name}
    </button>
  )

  const SkillPicker = ({ selected, setSel, activeCls, hint }: {
    selected: number[]; setSel: (v: number[]) => void; activeCls: string; hint: string
  }) => (
    <div>
      <div className="flex flex-wrap gap-2">
        {skills.map((s) => skillChip(s.id, selected, setSel, activeCls))}
      </div>
      <p className="mt-2 text-xs text-slate-400">{hint}</p>
    </div>
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">{isEdit ? 'Editar vaga' : 'Publicar vaga'}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {isEdit ? 'Atualize os dados da vaga.' : 'Preencha as 3 etapas para publicar uma nova oportunidade.'}
      </p>

      {/* Step indicator */}
      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              i <= step ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'
            }`}>{i + 1}</span>
            <span className={`hidden text-sm font-medium sm:inline ${i <= step ? 'text-slate-800' : 'text-slate-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-slate-200" />}
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-6">
        {/* Step 1 — dados e descrição */}
        {step === 0 && (
          <div className="card space-y-4 p-6">
            <h2 className="font-semibold text-slate-900">Dados da vaga</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Título da vaga" error={errors.title}>
                <input className="input sm:col-span-2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </Field>
              <Field label="Área" error={errors.category}>
                <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Localização" error={errors.location}>
                <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required placeholder="Ex.: São Paulo" />
              </Field>
              <Field label="Modelo de trabalho" error={errors.work_mode}>
                <select className="input" value={form.work_mode} onChange={(e) => setForm({ ...form, work_mode: e.target.value })}>
                  {Object.entries(WORK_MODE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Tipo de vaga" error={errors.job_type}>
                <select className="input" value={form.job_type} onChange={(e) => setForm({ ...form, job_type: e.target.value })}>
                  {Object.entries(JOB_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Senioridade" error={errors.seniority}>
                <select className="input" value={form.seniority} onChange={(e) => setForm({ ...form, seniority: e.target.value })}>
                  {Object.entries(SENIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Tipo de contrato" error={errors.contract_type}>
                <input className="input" value={form.contract_type} onChange={(e) => setForm({ ...form, contract_type: e.target.value })} placeholder="Ex.: CLT, PJ, Estágio" />
              </Field>
            </div>

            <Field label="Descrição da vaga" error={errors.description}>
              <textarea className="input min-h-32" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="Apresente a oportunidade, o time e o que a pessoa vai construir…" />
            </Field>
            <Field label="Responsabilidades" error={errors.responsibilities}>
              <textarea className="input min-h-24" value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} placeholder="Principais atividades do dia a dia…" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Salário mínimo" error={errors.salary_min}>
                <input className="input" type="number" min={0} step="0.01" value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value })} />
              </Field>
              <Field label="Salário máximo" error={errors.salary_max}>
                <input className="input" type="number" min={0} step="0.01" value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value })} />
              </Field>
              <Field label="Moeda" error={errors.currency}>
                <input className="input" maxLength={3} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
              </Field>
            </div>
          </div>
        )}

        {/* Step 2 — requisitos e critérios de matching */}
        {step === 1 && (
          <div className="card space-y-6 p-6">
            <div>
              <h2 className="font-semibold text-slate-900">Requisitos</h2>
              <Field label="Requisitos e qualificações" error={errors.requirements}>
                <textarea className="input mt-2 min-h-28" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder="Formação, vivência e qualificações esperadas…" />
              </Field>
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">Competências essenciais <span className="text-xs font-normal text-slate-400">(até 50 pts no matching)</span></h2>
              <div className="mt-3">
                <SkillPicker
                  selected={essentialIds} setSel={setEssentialIds}
                  activeCls="bg-brand-600 text-white ring-brand-600"
                  hint="Essenciais são obrigatórias — candidatos sem elas perdem pontos."
                />
              </div>
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">Competências desejáveis <span className="text-xs font-normal text-slate-400">(até 10 pts no matching)</span></h2>
              <div className="mt-3">
                <SkillPicker
                  selected={desiredIds} setSel={setDesiredIds}
                  activeCls="bg-accent-600 text-white ring-accent-600"
                  hint="Desejáveis são diferenciais — agregam pontos sem ser obrigatórias."
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">Como o matching funciona</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                <li>Essenciais: 50 pts — cobertura das competências obrigatórias</li>
                <li>Desejáveis: 10 pts — diferenciais</li>
                <li>Experiência: 25 pts — anos vs. senioridade + similaridade textual</li>
                <li>Preferências: 15 pts — local, modelo de trabalho e área</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 3 — revisão */}
        {step === 2 && (
          <div className="card space-y-6 p-6">
            <h2 className="font-semibold text-slate-900">Revisão e publicação</h2>

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-slate-900">{form.title}</p>
                  <p className="text-sm text-slate-500">
                    {label(CATEGORY_LABELS, form.category)} · {form.location} ·{' '}
                    {label(WORK_MODE_LABELS, form.work_mode)} · {label(JOB_TYPE_LABELS, form.job_type)} ·{' '}
                    {label(SENIORITY_LABELS, form.seniority)}
                  </p>
                </div>
                <span className="badge bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200">
                  {label(JOB_STATUS_LABELS, isEdit ? form.status : 'draft')}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{form.description}</p>
            </div>

            {form.responsibilities && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Responsabilidades</h3>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{form.responsibilities}</p>
              </div>
            )}
            {form.requirements && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Requisitos</h3>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{form.requirements}</p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="font-semibold text-slate-700">Essenciais ({essentialIds.length})</p>
                <p className="mt-1 text-slate-600">{essentialIds.map((sid) => skills.find((s) => s.id === sid)?.name).filter(Boolean).join(', ') || '—'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="font-semibold text-slate-700">Desejáveis ({desiredIds.length})</p>
                <p className="mt-1 text-slate-600">{desiredIds.map((sid) => skills.find((s) => s.id === sid)?.name).filter(Boolean).join(', ') || '—'}</p>
              </div>
            </div>

            {(form.salary_min || form.salary_max) && (
              <p className="text-sm text-slate-600">
                Faixa salarial: {form.salary_min || '—'} a {form.salary_max || '—'} {form.currency}
              </p>
            )}

            <div>
              <h3 className="text-sm font-semibold text-slate-700">Estado da vaga</h3>
              <div className="mt-2 flex gap-2">
                {(['draft', 'published', 'paused'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, status: s })}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium ring-1 ring-inset ${
                      form.status === s
                        ? 'bg-brand-600 text-white ring-brand-600'
                        : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {label(JOB_STATUS_LABELS, s)}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Somente vagas publicadas aparecem na busca pública e recebem candidaturas.
              </p>
            </div>
          </div>
        )}

        {error && <ErrorAlert message={error} />}

        <div className="flex gap-3">
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} className="btn-outline">
              ← Voltar
            </button>
          )}
          {step < 2 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!stepValid()}
              className="btn-primary flex-1"
            >
              Continuar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => save('draft')}
                disabled={saving}
                className="btn-outline"
              >
                Salvar rascunho
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Salvando…' : form.status === 'published' ? 'Publicar vaga' : 'Salvar vaga'}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}
