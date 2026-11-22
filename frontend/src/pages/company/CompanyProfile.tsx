import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { ErrorAlert, Field, Spinner } from '../../components/ui'
import { PasswordSection } from '../../components/PasswordSection'

export function CompanyProfile() {
  const { user, refresh } = useAuth()
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', city: '',
    company_name: '', description: '', website: '',
  })
  const [logo, setLogo] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    const p = user.company_profile
    setForm({
      first_name: user.first_name, last_name: user.last_name, email: user.email,
      phone: user.phone, city: user.city,
      company_name: p?.company_name ?? '', description: p?.description ?? '',
      website: p?.website ?? '',
    })
    setLoading(false)
  }, [user])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    setError('')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
    if (logo) fd.append('logo', logo)
    try {
      await api.patch('/auth/me/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await refresh()
      setMsg('Company profile saved.')
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />
  const profile = user?.company_profile

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Company profile</h1>
      <p className="mt-1 text-sm text-slate-500">This information appears on your job postings.</p>

      <form onSubmit={save} className="mt-6 space-y-6">
        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Account</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name"><input className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
            <Field label="Last name"><input className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
            <Field label="Email"><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Phone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="City"><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Company</h2>
          {profile?.logo_url && <img src={profile.logo_url} alt="Logo" className="mb-4 h-16 w-16 rounded-xl object-cover ring-2 ring-brand-200" />}
          <div className="grid gap-4">
            <Field label="Company name"><input className="input" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></Field>
            <Field label="Website"><input className="input" placeholder="https://" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></Field>
            <Field label="Description"><textarea className="input min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label="Logo">
              <input type="file" accept="image/*" className="input !py-2 text-xs" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} />
            </Field>
          </div>
        </div>

        {msg && <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">{msg}</p>}
        {error && <ErrorAlert message={error} />}
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save profile'}</button>
      </form>

      <div className="mt-6">
        <PasswordSection />
      </div>
    </div>
  )
}
