import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ErrorAlert, Field } from '../components/ui'

const HOME: Record<string, string> = {
  candidate: '/dashboard',
  company: '/company/dashboard',
}

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [role, setRole] = useState(params.get('role') === 'company' ? 'company' : 'candidate')
  const [form, setForm] = useState({
    username: '', email: '', password: '', password_confirm: '',
    first_name: '', last_name: '',
    headline: '', bio: '', education: '', experience_years: 0,
    company_name: '',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)
    try {
      await register({ ...form, role })
      navigate(HOME[role] ?? '/dashboard', { replace: true })
    } catch (err: any) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const flat: Record<string, string> = {}
        for (const [k, v] of Object.entries(data)) {
          flat[k] = Array.isArray(v) ? String(v[0]) : String(v)
        }
        setFieldErrors(flat)
        setError('Please fix the highlighted fields.')
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">Join Appliety as a candidate or a company</p>

        {/* Role selector */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {(['candidate', 'company'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                role === r
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className="font-semibold text-slate-900">{r === 'candidate' ? '🧑‍💼 I\'m a candidate' : '🏢 I\'m hiring'}</p>
              <p className="mt-1 text-xs text-slate-500">
                {r === 'candidate' ? 'Find jobs and get matched' : 'Publish vacancies and hire'}
              </p>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Username" error={fieldErrors.username}>
            <input className="input" value={form.username} onChange={(e) => set('username', e.target.value)} required />
          </Field>
          <Field label="Email" error={fieldErrors.email}>
            <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="First name">
            <input className="input" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
          </Field>
          <Field label="Last name">
            <input className="input" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
          </Field>
          <Field label="Password" error={fieldErrors.password} hint="Min. 8 characters">
            <input className="input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={8} />
          </Field>
          <Field label="Confirm password" error={fieldErrors.password_confirm}>
            <input className="input" type="password" value={form.password_confirm} onChange={(e) => set('password_confirm', e.target.value)} required />
          </Field>

          {role === 'candidate' && (
            <>
              <Field label="Headline" error={fieldErrors.headline} hint="e.g. Front-end developer">
                <input className="input sm:col-span-2" value={form.headline} onChange={(e) => set('headline', e.target.value)} />
              </Field>
              <Field label="Education">
                <input className="input" value={form.education} onChange={(e) => set('education', e.target.value)} />
              </Field>
              <Field label="Years of experience" error={fieldErrors.experience_years}>
                <input className="input" type="number" min={0} value={form.experience_years} onChange={(e) => set('experience_years', Number(e.target.value))} />
              </Field>
              <Field label="Bio" error={fieldErrors.bio}>
                <textarea className="input sm:col-span-2 min-h-24" value={form.bio} onChange={(e) => set('bio', e.target.value)} />
              </Field>
            </>
          )}

          {role === 'company' && (
            <Field label="Company name" error={fieldErrors.company_name}>
              <input className="input sm:col-span-2" value={form.company_name} onChange={(e) => set('company_name', e.target.value)} required={role === 'company'} />
            </Field>
          )}

          {error && <div className="sm:col-span-2"><ErrorAlert message={error} /></div>}

          <div className="sm:col-span-2">
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}
