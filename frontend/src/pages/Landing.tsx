import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Job } from '../types'
import { JobCard } from '../components/JobCard'
import { Spinner } from '../components/ui'

export function Landing() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    api.get('/jobs/', { params: { page_size: 6 } })
      .then(({ data }) => setJobs(data.results))
      .finally(() => setLoading(false))
  }, [])

  const homeTo = user?.role === 'candidate' ? '/applications'
    : user?.role === 'company' ? '/company/dashboard'
    : user?.role === 'admin' ? '/admin/dashboard'
    : '/jobs'

  return (
    <div>
      {/* Hero — Figma "PLATAFORMA DE RECRUTAMENTO / Seu talento. Novos caminhos." */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-brand-50">
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">Plataforma de recrutamento · Talentos &amp; oportunidades</p>
            <h1 className="mt-3 text-5xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl">
              Seu talento.<br />
              <span className="text-brand-600">
                Novos caminhos.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Encontre oportunidades que combinam com suas competências e
              acompanhe cada candidatura em um só lugar.
            </p>
            <form
              className="mt-8 flex max-w-xl gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                window.location.href = `/jobs?q=${encodeURIComponent(query)}`
              }}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Título ou área — Ex.: Design de produto"
                className="input flex-1 !rounded-full !border-slate-200 !bg-white shadow-sm"
              />
              <button type="submit" className="btn-primary !rounded-full !px-6">
                Buscar vagas
              </button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={user ? homeTo : '/register?role=candidate'} className="btn-primary">
                {user?.role === 'candidate' ? 'Minhas candidaturas' : 'Sou candidato(a)'}
              </Link>
              <Link to={user?.role === 'company' ? '/company/dashboard' : '/register?role=company'} className="btn-outline">
                {user?.role === 'company' ? 'Painel de vagas' : 'Quero contratar'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured jobs */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="eyebrow">Vagas recentes</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Oportunidades abertas</h2>
          </div>
          <Link to="/jobs" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            Ver todas →
          </Link>
        </div>
        {loading ? (
          <Spinner />
        ) : jobs.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma vaga publicada ainda.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* Two audiences — Figma CTA cards (visitors only) */}
      {!user && (
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-14 sm:grid-cols-2 sm:px-6">
          <div className="card flex flex-col gap-3 border-brand-200 bg-brand-50 p-7">
            <p className="eyebrow">Para quem busca</p>
            <h3 className="text-xl font-bold text-slate-900">Sua carreira, organizada.</h3>
            <p className="text-sm leading-relaxed text-slate-500">
              Crie seu perfil e acompanhe cada candidatura em um único painel.
              Seu próximo passo começa aqui.
            </p>
            <Link to="/register?role=candidate" className="btn-primary mt-2 w-fit">
              Criar conta de candidato →
            </Link>
          </div>
          <div className="card flex flex-col gap-3 border-accent-200 bg-accent-50 p-7">
            <p className="eyebrow">Para quem contrata</p>
            <h3 className="text-xl font-bold text-slate-900">Abra espaço para novos talentos.</h3>
            <p className="text-sm leading-relaxed text-slate-500">
              Publique vagas, organize perfis e avalie candidaturas com critérios explicáveis.
            </p>
            <Link to="/register?role=company" className="btn-accent mt-2 w-fit">
              Cadastrar uma empresa →
            </Link>
          </div>
        </div>
      </section>
      )}

      {/* Matching explainer */}
      <section className="border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <p className="eyebrow">Matching explicável</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Critérios claros, decisões humanas</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                O matching ajuda a localizar evidências profissionais nos currículos.
                Revise cada perfil antes de decidir — o score nunca aprova nem reprova
                uma candidatura automaticamente.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  ['Competências essenciais', '50 pts'],
                  ['Experiência', '25 pts'],
                  ['Preferências', '15 pts'],
                  ['Desejáveis', '10 pts'],
                ].map(([l, v]) => (
                  <span key={l} className="badge bg-white px-3 py-1.5 text-sm text-slate-700 ring-1 ring-inset ring-slate-200">
                    {l} · {v}
                  </span>
                ))}
              </div>
            </div>
            <div className="card grid grid-cols-2 gap-3 p-6">
              {[
                ['✓', 'Evidências do currículo', 'Cada critério mostra o que foi encontrado — integral, parcial ou não informado.'],
                ['◎', 'Sem decisão automática', 'Informações ausentes não são tratadas como falta de competência.'],
                ['↗', 'Dois sentidos', 'Candidatos veem vagas compatíveis; empresas veem currículos ranqueados.'],
                ['▤', 'Transparente', 'Pesos e critérios documentados e visíveis na interface.'],
              ].map(([icon, t, d]) => (
                <div key={t} className="rounded-xl border border-slate-100 p-4">
                  <span className="text-lg">{icon}</span>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{t}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
