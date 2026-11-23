import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CATEGORY_LABELS, WORK_MODE_LABELS } from '../lib/labels'
import { ErrorAlert, Field } from '../components/ui'
import { StepNav } from '../components/figma'
import { ApplietyLogo } from '../components/ApplietyLogo'

interface FormState {
  role: 'candidate' | 'company'
  username: string
  email: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
  phone: string
  city: string
  headline: string
  bio: string
  education: string
  experience_years: number
  preferred_category: string
  preferred_work_modes: string[]
  preferred_location: string
  company_name: string
  legal_name: string
  trade_name: string
  cnpj: string
  sector: string
  size: string
  state: string
  description: string
  website: string
}

const EMPTY: FormState = {
  role: 'candidate',
  username: '', email: '', password: '', password_confirm: '',
  first_name: '', last_name: '', phone: '', city: '',
  headline: '', bio: '', education: '', experience_years: 0,
  preferred_category: '', preferred_work_modes: [], preferred_location: '',
  company_name: '', legal_name: '', trade_name: '', cnpj: '', sector: '',
  size: '', state: '', description: '', website: '',
}

const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '500+']

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: keyof FormState, v: any) => setForm((f) => ({ ...f, [k]: v }))
  const isCompany = form.role === 'company'

  const toggleMode = (m: string) =>
    set('preferred_work_modes', form.preferred_work_modes.includes(m)
      ? form.preferred_work_modes.filter((x) => x !== m)
      : [...form.preferred_work_modes, m])

  const switchRole = (role: 'candidate' | 'company') => {
    setForm({ ...EMPTY, role })
    setStep(0)
    setError('')
  }

  const stepValid =
    step === 0
      ? !!(form.username && form.email && form.password && form.password_confirm &&
          form.password === form.password_confirm &&
          (!isCompany || (form.first_name && form.last_name)))
      : isCompany
        ? !!(form.company_name || form.legal_name)
        : !!(form.headline || form.bio || form.education)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (step === 0) {
      setStep(1)
      return
    }
    setLoading(true)
    try {
      await register({ ...form, role: form.role })
      navigate('/home', { replace: true })
    } catch (err: any) {
      const data = err?.response?.data
      const first = data && typeof data === 'object'
        ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' — ')
        : 'Erro ao cadastrar.'
      setError(first)
      setStep(0)
    } finally {
      setLoading(false)
    }
  }

  const brand = isCompany
    ? {
        title: 'Abra espaço para novos talentos.',
        tagline: 'Cadastre a sua empresa, publique vagas e encontre profissionais compatíveis com os seus critérios.',
        steps: ['Responsável', 'Dados da empresa'],
        tips: 'Preencha os dados da empresa com atenção — eles aparecem no perfil público das suas vagas.',
      }
    : {
        title: 'Seu talento. Novos caminhos.',
        tagline: 'Crie a sua conta, apresente o seu perfil e encontre oportunidades compatíveis com a sua trajetória.',
        steps: ['Acesso', 'Perfil e currículo'],
        tips: 'Você poderá enviar o currículo e detalhar experiências depois, na página do seu perfil.',
      }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel — Figma split layout */}
      <div className="hidden w-[46%] flex-col justify-between bg-brand-600 p-10 text-white lg:flex">
        <Link to="/" className="flex w-fit items-center rounded-xl bg-white px-3 py-2">
          <ApplietyLogo variant="horizontal" size="md" />
        </Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">{isCompany ? 'Cadastro de empresa' : 'Cadastro de candidato'}</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight">{brand.title}</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">{brand.tagline}</p>
          <div className="mt-8">
            <StepNav steps={brand.steps} current={step} />
          </div>
        </div>
        <div className="rounded-2xl bg-white/10 p-4 text-sm text-white/85 backdrop-blur">
          <p className="font-semibold">{brand.tips}</p>
        </div>
      </div>

      {/* Form side */}
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-lg">
          <div className="mb-5 flex items-center justify-between lg:hidden">
            <Link to="/" className="flex items-center">
              <ApplietyLogo variant="horizontal" size="md" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => switchRole(isCompany ? 'candidate' : 'company')}
            className="mb-4 text-sm font-semibold text-brand-600 hover:underline"
          >
            {isCompany ? 'Sou candidato(a) ↗' : 'Sou uma empresa ↗'}
          </button>

          <h2 className="text-2xl font-extrabold text-slate-900">
            {step === 0 ? (isCompany ? 'Dados do responsável' : 'Crie a sua conta') : isCompany ? 'Dados da empresa' : 'Complete o seu perfil'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {step === 0
              ? (isCompany ? 'Passo 1 de 2 — informe os dados da pessoa responsável.' : 'Passo 1 de 2 — crie o seu acesso.')
              : (isCompany ? 'Passo 2 de 2 — dados da empresa que aparecerão nas vagas.' : 'Passo 2 de 2 — conte um pouco sobre você.')}
          </p>

          <div className="card mt-6 p-6">
            {error && <div className="mb-4"><ErrorAlert message={error} /></div>}
            <form onSubmit={submit} className="space-y-4">
              {step === 0 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Nome *"><input className="input" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} required /></Field>
                    <Field label="Sobrenome *"><input className="input" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} required /></Field>
                  </div>
                  <Field label={isCompany ? 'E-mail profissional *' : 'E-mail *'}>
                    <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Celular"><input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(11) 99999-0000" /></Field>
                    <Field label="Cidade"><input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} /></Field>
                  </div>
                  {!isCompany && (
                    <>
                      <Field label="Nome de usuário *"><input className="input" value={form.username} onChange={(e) => set('username', e.target.value)} required /></Field>
                    </>
                  )}
                  {isCompany && (
                    <Field label="Nome de usuário *"><input className="input" value={form.username} onChange={(e) => set('username', e.target.value)} required /></Field>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Senha *"><input className="input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required /></Field>
                    <Field label="Confirmar senha *"><input className="input" type="password" value={form.password_confirm} onChange={(e) => set('password_confirm', e.target.value)} required /></Field>
                  </div>
                  {isCompany && (
                    <label className="flex items-start gap-2 text-sm text-slate-600">
                      <input type="checkbox" className="mt-0.5" required />
                      Confirmo que sou responsável autorizado pela empresa.
                    </label>
                  )}
                  <label className="flex items-start gap-2 text-sm text-slate-600">
                    <input type="checkbox" className="mt-0.5" required />
                    Li e aceito os Termos de uso e a Política de privacidade.
                  </label>
                </>
              )}

              {step === 1 && !isCompany && (
                <>
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-800">Currículo e dados extraídos</p>
                    <p className="mt-1">Você poderá enviar o seu currículo (PDF) na página de perfil após o cadastro.</p>
                  </div>
                  <Field label="Título profissional *"><input className="input" value={form.headline} onChange={(e) => set('headline', e.target.value)} placeholder="Ex.: Desenvolvedor Full Stack" /></Field>
                  <Field label="Formação"><input className="input" value={form.education} onChange={(e) => set('education', e.target.value)} placeholder="Ex.: ADS — SENAI, 2025" /></Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Anos de experiência">
                      <select className="input" value={form.experience_years} onChange={(e) => set('experience_years', Number(e.target.value))}>
                        {[0, 1, 2, 3, 5, 8, 10].map((y) => <option key={y} value={y}>{y} ano(s)</option>)}
                      </select>
                    </Field>
                    <Field label="Local de interesse"><input className="input" value={form.preferred_location} onChange={(e) => set('preferred_location', e.target.value)} placeholder="Ex.: São Paulo, remoto" /></Field>
                  </div>
                  <Field label="Área de interesse">
                    <select className="input" value={form.preferred_category} onChange={(e) => set('preferred_category', e.target.value)}>
                      <option value="">Selecione…</option>
                      {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </Field>
                  <div>
                    <span className="mb-2 block text-sm font-medium text-slate-700">Modelo de trabalho preferido</span>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(WORK_MODE_LABELS).map(([v, l]) => (
                        <button type="button" key={v} onClick={() => toggleMode(v)}
                          className={`rounded-full border px-3 py-1.5 text-sm font-medium ${form.preferred_work_modes.includes(v) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field label="Resumo profissional"><textarea className="input" rows={4} value={form.bio} onChange={(e) => set('bio', e.target.value)} placeholder="Conte sua trajetória, projetos e o que procura…" /></Field>
                </>
              )}

              {step === 1 && isCompany && (
                <>
                  <Field label="Nome fantasia *"><input className="input" value={form.company_name} onChange={(e) => set('company_name', e.target.value)} placeholder="Nome exibido nas vagas" /></Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Razão social"><input className="input" value={form.legal_name} onChange={(e) => set('legal_name', e.target.value)} /></Field>
                    <Field label="Nome de exibição"><input className="input" value={form.trade_name} onChange={(e) => set('trade_name', e.target.value)} /></Field>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="CNPJ"><input className="input" value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00" /></Field>
                    <Field label="Setor"><input className="input" value={form.sector} onChange={(e) => set('sector', e.target.value)} /></Field>
                    <Field label="Porte">
                      <select className="input" value={form.size} onChange={(e) => set('size', e.target.value)}>
                        <option value="">Selecione…</option>
                        {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} funcionários</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Estado (UF)"><input className="input" value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="SP" maxLength={2} /></Field>
                    <Field label="Site institucional"><input className="input" type="url" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://…" /></Field>
                  </div>
                  <Field label="Descrição da empresa"><textarea className="input" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Apresente a empresa, a cultura e o que você oferece…" /></Field>
                  <p className="text-xs text-slate-500">Você poderá editar os dados do responsável depois, em Perfil da empresa.</p>
                </>
              )}

              <div className="flex items-center justify-between pt-2">
                {step === 1 ? (
                  <button type="button" onClick={() => setStep(0)} className="text-sm font-semibold text-slate-600 hover:text-slate-900">← {isCompany ? 'Dados do responsável' : 'Dados da conta'}</button>
                ) : <span />}
                <button type="submit" disabled={!stepValid || loading} className="btn-primary">
                  {loading ? 'Enviando…' : step === 0 ? 'Continuar →' : isCompany ? 'Concluir cadastro da empresa' : 'Concluir perfil'}
                </button>
              </div>
            </form>
          </div>

          <p className="mt-4 text-center text-sm text-slate-500">
            Já tem conta? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

