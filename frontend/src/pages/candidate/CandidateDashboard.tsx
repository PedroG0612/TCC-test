import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import type { Application, JobMatch, Paginated } from '../../types'
import { ScoreBadge } from '../../components/ScoreBadge'
import { StatusBadge } from '../../components/StatusBadge'
import { Spinner, StatCard } from '../../components/ui'
import { WORK_MODE_LABELS, label } from '../../lib/labels'
import { AreaHeader } from '../../components/figma'

export function CandidateDashboard() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<JobMatch[]>([])
  const [apps, setApps] = useState<Paginated<Application> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<JobMatch[]>('/matching/jobs/', { params: { limit: 3 } }).catch(() => ({ data: [] })),
      api.get<Paginated<Application>>('/applications/', { params: { page_size: 5 } }).catch(() => ({ data: null })),
    ]).then(([m, a]) => {
      setMatches(m.data)
      setApps(a.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const profile = user?.candidate_profile
  const profileComplete = !!(profile?.headline && profile?.bio)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AreaHeader
        eyebrow="CANDIDATO / VISÃO GERAL"
        title={`Olá, ${user?.first_name || user?.username}`}
        subtitle="Veja o que está acontecendo na sua busca por vagas."
        actions={
          <>
            <Link to="/matching" className="btn-accent">Ver vagas para mim</Link>
            <Link to="/jobs" className="btn-outline">Buscar vagas</Link>
          </>
        }
      />

      {!profileComplete && (
        <div className="card mb-6 flex flex-wrap items-center justify-between gap-3 border-accent-200 bg-accent-50 p-5">
          <p className="text-sm text-accent-800">
            💡 Complete seu perfil para receber matches melhores — adicione título, bio, experiências e habilidades.
          </p>
          <Link to="/profile" className="btn-accent !py-2">Completar perfil</Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Candidaturas enviadas" value={apps?.count ?? 0} />
        <StatCard label="Melhor compatibilidade" value={matches[0]?.score ?? '—'} accent="violet" />
        <StatCard label="Habilidades no perfil" value={profile?.skills.length ?? 0} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* Recommended matches */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Vagas para seu perfil</h2>
            <Link to="/matching" className="text-sm font-semibold text-brand-600 hover:underline">Ver todas</Link>
          </div>
          {matches.length === 0 ? (
            <p className="card p-6 text-sm text-slate-500">Nenhuma recomendação ainda — continue navegando pelas vagas.</p>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => (
                <Link key={m.job.id} to={`/jobs/${m.job.id}`} className="card flex items-center justify-between gap-3 p-4 transition-shadow hover:shadow-card-hover">
                  <div>
                    <p className="font-semibold text-slate-900">{m.job.title}</p>
                    <p className="text-sm text-slate-500">{m.job.company_name} · {m.job.location}</p>
                  </div>
                  <ScoreBadge score={m.score} />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent applications */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Candidaturas recentes</h2>
            <Link to="/applications" className="text-sm font-semibold text-brand-600 hover:underline">Ver todas</Link>
          </div>
          {!apps || apps.results.length === 0 ? (
            <p className="card p-6 text-sm text-slate-500">Você ainda não se candidatou a nenhuma vaga.</p>
          ) : (
            <div className="card divide-y divide-slate-100">
              {apps.results.map((app) => (
                <div key={app.id} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium text-slate-900">{app.job_title}</p>
                    <p className="text-sm text-slate-500">{app.company_name}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
