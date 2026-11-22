import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/api'
import type { Job, Skill } from '../../types'
import { ErrorAlert, Field, Spinner } from '../../components/ui'

const CATEGORIES = ['technology', 'design', 'marketing', 'business', 'engineering', 'health', 'education', 'other']
const WORK_MODES = ['remote', 'hybrid', 'onsite']
const JOB_TYPES = ['full_time', 'part_time', 'internship', 'freelance']
const STATUSES = ['draft', 'published', 'closed']

export function JobForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [skills, setSkills] = useState<Skill[]>([])
  const [selectedSkills, setSelectedSkills] = useState<number[]>([])
  const [form, setForm] = useState({
    title: '', description: '', requirements: '', category: 'technology',
    location: '', work_mode: 'onsite', job_type: 'full_time',
    salary_min: '', salary_max: '', currency: 'BRL', status: 'draft',
  })
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Skill[]>('/skills/').then(({ data }) => setSkills(data)).catch(() => {})
    if (isEdit) {
      api.get<Job>(`/jobs/${id}/`).then(({ data }) => {
        setForm({
          title: data.title, description: data.description, requirements: data.requirements,
          category: data.category, location: data.location, work_mode: data.work_mode,
          job_type: data.job_type,
          salary_min: data.salary_min ?? '', salary_max: data.salary_max ?? '',
          currency: data.currency, status: data.status,
        })
        setSelectedSkills(data.skills.map((s) => s.id))
      }).finally(() => setLoading(false))
    }
  }, [id, isEdit])

  const toggleSkill = (sid: number) =>
    setSelectedSkills((s) => (s.includes(sid) ? s.filter((x) => x !== sid) : [...s, sid]))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    setError('')
    const payload: Record<string, unknown> = {
      ...form,
      salary_min: form.salary_min || null,
      salary_max: form.salary_max || null,
      skill_ids: selectedSkills,
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
      setError('Could not save vacancy. Please review the form.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">{isEdit ? 'Edit vacancy' : 'New vacancy'}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {isEdit ? 'Update the job posting details.' : 'Fill in the details to publish a new opportunity.'}
      </p>

      <form onSubmit={save} className="mt-6 space-y-6">
        <div className="card space-y-4 p-6">
          <h2 className="font-semibold text-slate-900">Job details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Job title" error={errors.title}>
              <input className="input sm:col-span-2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </Field>
            <Field label="Category" error={errors.category}>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
              </select>
            </Field>
            <Field label="Location" error={errors.location}>
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
            </Field>
            <Field label="Work mode" error={errors.work_mode}>
              <select className="input" value={form.work_mode} onChange={(e) => setForm({ ...form, work_mode: e.target.value })}>
                {WORK_MODES.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </Field>
            <Field label="Job type" error={errors.job_type}>
              <select className="input" value={form.job_type} onChange={(e) => setForm({ ...form, job_type: e.target.value })}>
                {JOB_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', '-')}</option>)}
              </select>
            </Field>
            {isEdit && (
              <Field label="Status" error={errors.status}>
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            )}
          </div>

          <Field label="Description" error={errors.description}>
            <textarea className="input min-h-32" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </Field>
          <Field label="Requirements" error={errors.requirements}>
            <textarea className="input min-h-24" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Min salary" error={errors.salary_min}>
              <input className="input" type="number" min={0} step="0.01" value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value })} />
            </Field>
            <Field label="Max salary" error={errors.salary_max}>
              <input className="input" type="number" min={0} step="0.01" value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value })} />
            </Field>
            <Field label="Currency" error={errors.currency}>
              <input className="input" maxLength={3} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
            </Field>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-1 font-semibold text-slate-900">Skills</h2>
          <p className="mb-3 text-xs text-slate-400">Select the skills this vacancy requires — used by the matching engine.</p>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSkill(s.id)}
                className={`badge px-3 py-1.5 text-sm ring-1 ring-inset transition-colors ${
                  selectedSkills.includes(s.id)
                    ? 'bg-accent-600 text-white ring-accent-600'
                    : 'bg-slate-100 text-slate-600 ring-slate-200 hover:bg-slate-200'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {error && <ErrorAlert message={error} />}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : isEdit ? 'Update vacancy' : 'Publish vacancy'}
          </button>
          <button type="button" onClick={() => navigate('/company/jobs')} className="btn-outline">Cancel</button>
        </div>
      </form>
    </div>
  )
}
