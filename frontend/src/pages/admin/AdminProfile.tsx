import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { ErrorAlert, Field, Spinner } from '../../components/ui'
import { AreaHeader } from '../../components/figma'

export function AdminProfile() {
  const { user, refresh } = useAuth()
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', city: '' })
  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    setForm({
      first_name: user.first_name, last_name: user.last_name, email: user.email,
      phone: user.phone, city: user.city,
    })
    setLoading(false)
  }, [user])

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    setError('')
    try {
      await api.patch('/auth/me/', form)
      await refresh()
      setMsg('Perfil salvo.')
    } catch {
      setError('Não foi possível salvar o perfil.')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw.new_password !== pw.confirm) {
      setError('As novas senhas não coincidem.')
      return
    }
    setSaving(true)
    setMsg('')
    setError('')
    try {
      await api.post('/auth/password/change/', {
        current_password: pw.current_password,
        new_password: pw.new_password,
      })
      setPw({ current_password: '', new_password: '', confirm: '' })
      setMsg('Senha atualizada.')
    } catch (err: any) {
      setError(err.response?.data?.new_password?.[0] ?? 'Não foi possível alterar a senha.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <AreaHeader eyebrow="ADMIN / PERFIL" title="Minha conta" />

      <form onSubmit={saveProfile} className="card mt-6 space-y-4 p-6">
        <h2 className="font-semibold text-slate-900">Perfil</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome"><input className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
          <Field label="Sobrenome"><input className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
          <Field label="E-mail"><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Telefone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Cidade"><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
        </div>
        {msg && <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">{msg}</p>}
        {error && <ErrorAlert message={error} />}
        <button type="submit" disabled={saving} className="btn-primary">Salvar</button>
      </form>

      <form onSubmit={changePassword} className="card mt-6 space-y-4 p-6">
        <h2 className="font-semibold text-slate-900">Alterar senha</h2>
        <Field label="Senha atual"><input className="input" type="password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} required /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nova senha"><input className="input" type="password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} required minLength={8} /></Field>
          <Field label="Confirmar nova senha"><input className="input" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required /></Field>
        </div>
        <button type="submit" disabled={saving} className="btn-outline">Atualizar senha</button>
      </form>
    </div>
  )
}
