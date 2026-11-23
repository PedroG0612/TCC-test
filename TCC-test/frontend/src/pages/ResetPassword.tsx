import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import { ErrorAlert, Field } from '../components/ui'

export function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/password/reset/confirm/', {
        uid: params.get('uid'),
        token: params.get('token'),
        new_password: password,
      })
      navigate('/login', { replace: true })
    } catch (err: any) {
      const data = err.response?.data
      setError(
        data?.new_password?.[0] ??
        data?.detail ??
        'Link inválido ou expirado. Solicite um novo.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-slate-900">Redefinir senha</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Nova senha" hint="Mínimo de 8 caracteres">
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoFocus />
          </Field>
          <Field label="Confirmar nova senha">
            <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </Field>
          {error && <ErrorAlert message={error} />}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Salvando…' : 'Salvar nova senha'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">Voltar para o login</Link>
        </p>
      </div>
    </div>
  )
}
