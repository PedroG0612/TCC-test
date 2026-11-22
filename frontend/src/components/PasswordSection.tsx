import { useState } from 'react'
import api from '../lib/api'
import { ErrorAlert, Field } from './ui'

export function PasswordSection() {
  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setError('')
    if (pw.new_password !== pw.confirm) {
      setError('New passwords do not match.')
      return
    }
    setSaving(true)
    try {
      await api.post('/auth/password/change/', {
        current_password: pw.current_password,
        new_password: pw.new_password,
      })
      setPw({ current_password: '', new_password: '', confirm: '' })
      setMsg('Password updated.')
    } catch (err: any) {
      setError(err.response?.data?.new_password?.[0] ?? 'Could not change password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <h2 className="font-semibold text-slate-900">Change password</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Current password">
          <input className="input" type="password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} required />
        </Field>
        <Field label="New password">
          <input className="input" type="password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} required minLength={8} />
        </Field>
        <Field label="Confirm">
          <input className="input" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required />
        </Field>
      </div>
      {msg && <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">{msg}</p>}
      {error && <ErrorAlert message={error} />}
      <button type="submit" disabled={saving} className="btn-outline">{saving ? 'Updating…' : 'Update password'}</button>
    </form>
  )
}
