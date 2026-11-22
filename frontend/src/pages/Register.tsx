import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ErrorAlert, Field } from '../components/ui'
import { CATEGORY_LABELS, WORK_MODE_LABELS, label } from '../lib/labels'

const HOME: Record<string, string> = {
  candidate: '/dashboard',
  company: '/company/dashboard',
}

const STEPS = ['Conta', 'Perfil']

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [role, setRole] = useState(params.get('role') === 'company' ? 'company' : 'candidate')
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Record<string, unknown>>({
    username: '', email: '', password: '', password_confirm: '',
    first_name: '', last_name: '', phone: '', city: '',
    // candidate step 2
    headline: '', bio: '', education: '', experience_years: 0,
    preferred_category: '', preferred_work_modes: [] as string[],
    preferred_location: '',
    // company step 2
    company_name: '', legal_name: '', trade_name: '', cnpj: '',
    sector: '', size: '', state: '', website: '', description: '',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  const toggleWorkMode = (mode: string) => {
    const modes = form.preferred_work_modes as string[]
    set('preferred_work_modes', modes.includes(mode) ? modes.filter((m) => m !== mode) : [...modes, mode])
  }

  const stepValid = () => {
    if (step === 0) {
      return !!form.username && !!form.email &&
        String(form.password).length >= 8 && form.password === form.password_confirm &&
        (role !== 'company' || !!form.company_name || !!form.first_name)
    }
    return true
  }

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
        setError('Corrija os campos destacados.')
      } else {
        setError('Falha no cadastro. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-slate-900">Criar conta</h1>
        <p className="mt-1 text-sm text-slate-500">
          {role === 'candidate' ? 'Candidate-se a vagas e receba matches' : 'Publique vagas e encontre talentos'}
        </p>

        {/* Role selector */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {(['candidate', 'company'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setRole(r); setStep(0); setError(''); setFieldErrors({}) }}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                role === r ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className="font-semibold text-slate-900">{r === 'candidate' ? '🧑‍💼 Sou candidato(a)' : '🏢 Quero contratar'}</p>
              <p className="mt-1 text-xs text-slate-500">
                {r === 'candidate' ? 'Encontre vagas compatíveis' : 'Publique vagas e gerencie candidatos'}
              </p>
            </button>
          ))}
        </div>

        {/* Step indicator */}
        <div className="mt-6 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                i <= step ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>{i + 1}</span>
              <span className={`text-sm font-medium ${i <= step ? 'text-slate-800' : 'text-slate-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <span className="mx-1 h-px w-8 bg-slate-200" />}
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          {step === 0 && (
            <>
              {role === 'company' && (
                <Field label="Nome da empresa" error={fieldErrors.company_name} hint="Razão social ou nome fantasia">
                  <input className="input sm:col-span-2" value={String(form.company_name)} onChange={(e) => set('company_name', e.target.value)} />
                </Field>
              )}
              <Field label="Nome" error={fieldErrors.first_name}>
                <input className="input" value={String(form.first_name)} onChange={(e) => set('first_name', e.target.value)} />
              </Field>
              <Field label="Sobrenome" error={fieldErrors.last_name}>
                <input className="input" value={String(form.last_name)} onChange={(e) => set('last_name', e.target.value)} />
              </Field>
              <Field label="E-mail" error={fieldErrors.email}>
                <input className="input" type="email" value={String(form.email)} onChange={(e) => set('email', e.target.value)} required />
              </Field>
              <Field label="Telefone" error={fieldErrors.phone}>
                <input className="input" value={String(form.phone)} onChange={(e) => set('phone', e.target.value)} />
              </Field>
              <Field label="Cidade" error={fieldErrors.city}>
                <input className="input" value={String(form.city)} onChange={(e) => set('city', e.target.value)} />
              </Field>
              <Field label="Senha" error={fieldErrors.password} hint="Mínimo de 8 caracteres">
                <input className="input" type="password" value={String(form.password)} onChange={(e) => set('password', e.target.value)} required minLength={8} />
              </Field>
              <Field label="Confirmar senha" error={fieldErrors.password_confirm}>
                <input className="input" type="password" value={String(form.password_confirm)} onChange={(e) => set('password_confirm', e.target.value)} required />
              </Field>
              {role === 'company' && (
                <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="flex items-start gap-2 text-sm text-slate-700">
                    <input type="checkbox" className="mt-0.5" required />
                    <span>Confirmo que sou responsável pela empresa e autorizo o uso dos dados conforme os termos de uso e a política de privacidade.</span>
                  </label>
                </div>
              )}
            </>
          )}

          {step === 1 && role === 'candidate' && (
            <>
              <Field label="Título profissional" error={fieldErrors.headline} hint="Ex.: Desenvolvedor(a) Front-End">
                <input className="input sm:col-span-2" value={String(form.headline)} onChange={(e) => set('headline', e.target.value)} />
              </Field>
              <Field label="Formação" error={fieldErrors.education}>
                <input className="input" value={String(form.education)} onChange={(e) => set('education', e.target.value)} />
              </Field>
              <Field label="Anos de experiência" error={fieldErrors.experience_years}>
                <input className="input" type="number" min={0} value={Number(form.experience_years)} onChange={(e) => set('experience_years', Number(e.target.value))} />
              </Field>
              <Field label="Área de interesse" error={fieldErrors.preferred_category}>
                <select className="input" value={String(form.preferred_category)} onChange={(e) => set('preferred_category', e.target.value)}>
                  <option value="">Selecione…</option>
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Localização preferida" error={fieldErrors.preferred_location}>
                <input className="input" value={String(form.preferred_location)} onChange={(e) => set('preferred_location', e.target.value)} placeholder="Ex.: São Paulo" />
              </Field>
              <Field label="Modelo de trabalho preferido">
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(WORK_MODE_LABELS).map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => toggleWorkMode(v)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors ${
                        (form.preferred_work_modes as string[]).includes(v)
                          ? 'bg-brand-600 text-white ring-brand-600'
                          : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Sobre você" error={fieldErrors.bio}>
                <textarea className="input sm:col-span-2 min-h-24" value={String(form.bio)} onChange={(e) => set('bio', e.target.value)} placeholder="Resumo profissional, projetos, o que você busca…" />
              </Field>
              <p className="sm:col-span-2 rounded-xl bg-brand-50 px-4 py-3 text-xs text-brand-700">
                💡 Você poderá enviar seu currículo (PDF/DOCX até 5 MB) na página de perfil após o cadastro.
              </p>
            </>
          )}

          {step === 1 && role === 'company' && (
            <>
              <Field label="Nome fantasia" error={fieldErrors.trade_name}>
                <input className="input" value={String(form.trade_name)} onChange={(e) => set('trade_name', e.target.value)} />
              </Field>
              <Field label="CNPJ" error={fieldErrors.cnpj}>
                <input className="input" value={String(form.cnpj)} onChange={(e) => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
              </Field>
              <Field label="Razão social" error={fieldErrors.legal_name}>
                <input className="input" value={String(form.legal_name)} onChange={(e) => set('legal_name', e.target.value)} />
              </Field>
              <Field label="Setor" error={fieldErrors.sector}>
                <input className="input" value={String(form.sector)} onChange={(e) => set('sector', e.target.value)} placeholder="Ex.: Tecnologia" />
              </Field>
              <Field label="Tamanho da empresa" error={fieldErrors.size}>
                <select className="input" value={String(form.size)} onChange={(e) => set('size', e.target.value)}>
                  <option value="">Selecione…</option>
                  <option value="1-10">1–10 funcionários</option>
                  <option value="11-50">11–50 funcionários</option>
                  <option value="51-200">51–200 funcionários</option>
                  <option value="201-500">201–500 funcionários</option>
                  <option value="500+">500+ funcionários</option>
                </select>
              </Field>
              <Field label="Estado" error={fieldErrors.state}>
                <input className="input" value={String(form.state)} onChange={(e) => set('state', e.target.value)} placeholder="UF" maxLength={2} />
              </Field>
              <Field label="Site" error={fieldErrors.website}>
                <input className="input" type="url" value={String(form.website)} onChange={(e) => set('website', e.target.value)} placeholder="https://" />
              </Field>
              <Field label="Descrição da empresa" error={fieldErrors.description}>
                <textarea className="input sm:col-span-2 min-h-24" value={String(form.description)} onChange={(e) => set('description', e.target.value)} />
              </Field>
            </>
          )}

          {error && <div className="sm:col-span-2"><ErrorAlert message={error} /></div>}

          <div className="flex gap-3 sm:col-span-2">
            {step === 1 && (
              <button type="button" onClick={() => setStep(0)} className="btn-outline flex-1">
                ← Voltar
              </button>
            )}
            {step === 0 ? (
              <button type="button" onClick={() => setStep(1)} disabled={!stepValid()} className="btn-primary flex-1">
                Continuar
              </button>
            ) : (
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Criando conta…' : 'Concluir cadastro'}
              </button>
            )}
          </div>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Já tem conta? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
