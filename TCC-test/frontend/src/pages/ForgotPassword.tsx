import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { ErrorAlert, Field } from '../components/ui'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/password/reset/', { email })
      setSent(true)
    } catch {
      setError('Não foi possível processar a solicitação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-slate-900">Recuperar senha</h1>
        {sent ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
              Se existir uma conta com este e-mail, enviamos um link de redefinição.
              Verifique sua caixa de entrada (e o spam).
            </div>
            <Link to="/login" className="btn-outline block text-center">Voltar para o login</Link>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate-500">
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <Field label="E-mail">
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </Field>
              {error && <ErrorAlert message={error} />}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Enviando…' : 'Enviar link de redefinição'}
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-slate-500">
              <Link to="/login" className="font-semibold text-brand-600 hover:underline">Voltar para o login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
