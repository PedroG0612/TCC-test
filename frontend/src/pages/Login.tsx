import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ErrorAlert, Field } from '../components/ui'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = (location.state as any)?.from?.pathname

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      const role = params.get('role')
      const home = from ?? (role === 'company' ? '/company/dashboard' : role === 'admin' ? '/admin/dashboard' : '/dashboard')
      navigate(home, { replace: true })
    } catch {
      setError('E-mail/usuário ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-slate-900">Bem-vindo de volta</h1>
        <p className="mt-1 text-sm text-slate-500">Entre na sua conta Appliety</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="E-mail ou usuário">
            <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required autoFocus />
          </Field>
          <Field label="Senha">
            <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </Field>
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline">
              Esqueci minha senha
            </Link>
          </div>
          {error && <ErrorAlert message={error} />}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
          Não tem conta? <Link to="/register" className="font-semibold text-brand-600 hover:underline">Cadastre-se</Link>
        </p>
      </div>
    </div>
  )
}
