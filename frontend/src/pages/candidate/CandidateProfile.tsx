import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import type { Skill } from '../../types'
import { ErrorAlert, Field, Spinner } from '../../components/ui'
import { PasswordSection } from '../../components/PasswordSection'

export function CandidateProfile() {
  const { user, refresh } = useAuth()
  const [skills, setSkills] = useState<Skill[]>([])
  const [selectedSkills, setSelectedSkills] = useState<number[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', city: '',
    headline: '', bio: '', education: '', experience_years: 0,
  })
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
    })
    setSelectedSkills(p?.skills.map((s) => s.id) ?? [])
    api.get<Skill[]>('/skills/').then(({ data }) => setSkills(data)).catch(() => {})
    setLoading(false)
  }, [user])

  const toggleSkill = (id: number) =>
    setSelectedSkills((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

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

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    setError('')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
    selectedSkills.forEach((id) => fd.append('skills', String(id)))
    if (resume) fd.append('resume', resume)
    if (photo) fd.append('photo', photo)
    try {
      await api.patch('/auth/me/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await refresh()
      setMsg('Profile saved successfully.')
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  const profile = user?.candidate_profile

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">My profile</h1>
      <p className="mt-1 text-sm text-slate-500">Keep your information up to date to improve your matches.</p>

      <form onSubmit={save} className="mt-6 space-y-6">
        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Personal information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name"><input className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
            <Field label="Last name"><input className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
            <Field label="Email"><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Phone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="City"><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          </div>
          {profile?.photo_url && (
            <img src={profile.photo_url} alt="Profile" className="mt-4 h-20 w-20 rounded-full object-cover ring-2 ring-brand-200" />
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Profile photo">
              <input type="file" accept="image/*" className="input !py-2 text-xs" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
            </Field>
            <Field label="Resume (PDF)">
              <input type="file" accept=".pdf,.doc,.docx" className="input !py-2 text-xs" onChange={(e) => setResume(e.target.files?.[0] ?? null)} />
              {profile?.resume_url && <a href={profile.resume_url} target="_blank" rel="noreferrer" className="text-xs text-brand-600 underline">Current resume</a>}
            </Field>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Professional profile</h2>
          <div className="grid gap-4">
            <Field label="Headline"><input className="input" placeholder="e.g. Front-end developer" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Education"><input className="input" value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} /></Field>
              <Field label="Years of experience"><input className="input" type="number" min={0} value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: Number(e.target.value) })} /></Field>
            </div>
            <Field label="Bio"><textarea className="input min-h-28" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></Field>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Skills</h2>
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
            <input className="input" placeholder="Add a new skill…" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
            <button type="button" onClick={addSkill} className="btn-outline">Add</button>
          </div>
        </div>

        {msg && <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">{msg}</p>}
        {error && <ErrorAlert message={error} />}
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      <div className="mt-6">
        <PasswordSection />
      </div>
    </div>
  )
}
