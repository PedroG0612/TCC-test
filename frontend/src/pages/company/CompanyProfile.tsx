import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { ErrorAlert, Field, Spinner } from '../../components/ui'
import { PasswordSection } from '../../components/PasswordSection'

export function CompanyProfile() {
  const { user, refresh } = useAuth()
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', city: '',
    company_name: '', legal_name: '', trade_name: '', cnpj: '', sector: '',
    size: '', state: '', description: '', website: '',
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
      company_name: p?.company_name ?? '', legal_name: p?.legal_name ?? '',
      trade_name: p?.trade_name ?? '', cnpj: p?.cnpj ?? '', sector: p?.sector ?? '',
      size: p?.size ?? '', state: p?.state ?? '', description: p?.description ?? '',
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
      setMsg('Perfil da empresa salvo.')
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />
  const profile = user?.company_profile

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Perfil da empresa</h1>
      <p className="mt-1 text-sm text-slate-500">Estas informações aparecem nas suas vagas publicadas.</p>

      <form onSubmit={save} className="mt-6 space-y-6">
        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Responsável</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome"><input className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
            <Field label="Sobrenome"><input className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
            <Field label="E-mail"><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Telefone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Cidade"><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Empresa</h2>
          {profile?.logo_url && <img src={profile.logo_url} alt="Logo" className="mb-4 h-16 w-16 rounded-xl object-cover ring-2 ring-brand-200" />}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome fantasia"><input className="input" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></Field>
            <Field label="Razão social"><input className="input" value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} /></Field>
            <Field label="Nome fantasia (trade)"><input className="input" value={form.trade_name} onChange={(e) => setForm({ ...form, trade_name: e.target.value })} /></Field>
            <Field label="CNPJ"><input className="input" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" /></Field>
            <Field label="Setor"><input className="input" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} /></Field>
            <Field label="Tamanho">
              <select className="input" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}>
                <option value="">Selecione…</option>
                <option value="1-10">1–10 funcionários</option>
                <option value="11-50">11–50 funcionários</option>
                <option value="51-200">51–200 funcionários</option>
                <option value="201-500">201–500 funcionários</option>
                <option value="500+">500+ funcionários</option>
              </select>
            </Field>
            <Field label="Estado (UF)"><input className="input" maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></Field>
            <Field label="Site"><input className="input" placeholder="https://" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></Field>
            <Field label="Descrição"><textarea className="input sm:col-span-2 min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label="Logo">
              <input type="file" accept="image/*" className="input !py-2 text-xs" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} />
            </Field>
          </div>
        </div>

        {msg && <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">{msg}</p>}
        {error && <ErrorAlert message={error} />}
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando…' : 'Salvar perfil'}</button>
      </form>

      <div className="mt-6">
        <PasswordSection />
      </div>
    </div>
  )
}
