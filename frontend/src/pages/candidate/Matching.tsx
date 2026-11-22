import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import type { JobMatch } from '../../types'
import { ScoreBadge } from '../../components/ScoreBadge'
import { MatchBreakdownView } from '../../components/MatchBreakdown'
import { EmptyState, Spinner } from '../../components/ui'
import { WORK_MODE_LABELS, label } from '../../lib/labels'

export function Matching() {
  const [matches, setMatches] = useState<JobMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(10)
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    api.get<JobMatch[]>('/matching/jobs/', { params: { limit } })
      .then(({ data }) => setMatches(data))
      .finally(() => setLoading(false))
  }, [limit])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-2xl">✨</span>
        <h1 className="text-2xl font-bold text-slate-900">Vagas para meu perfil</h1>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-slate-500">
        Vagas ranqueadas por compatibilidade com seu perfil. O score considera
        competências essenciais (50 pts), desejáveis (10 pts), experiência (25 pts)
        e preferências (15 pts). Uma recomendação <strong>não</strong> envia candidatura
        automaticamente — você decide quando se candidatar.
      </p>

      {loading ? (
        <Spinner />
      ) : matches.length === 0 ? (
        <EmptyState
          title="Nenhum match ainda"
          hint="Complete seu perfil com habilidades, experiências e preferências."
          action={<Link to="/profile" className="btn-primary">Editar perfil</Link>}
        />
      ) : (
        <div className="space-y-4">
          {matches.map((m, i) => (
            <div
              key={m.job.id}
              className="card p-5 transition-all hover:shadow-card-hover"
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-bold text-white">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`/jobs/${m.job.id}`} className="font-semibold text-slate-900 hover:text-brand-700">
                    {m.job.title}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {m.job.company_name} · {m.job.location} · {label(WORK_MODE_LABELS, m.job.work_mode)}
                  </p>
                  {m.matched_skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.matched_skills.map((s) => (
                        <span key={s} className="badge bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <ScoreBadge score={m.score} />
                <button
                  className="text-xs font-medium text-brand-600 hover:underline"
                  onClick={() => setExpanded(expanded === m.job.id ? null : m.job.id)}
                >
                  {expanded === m.job.id ? 'Ocultar análise' : 'Ver análise'}
                </button>
              </div>
              {expanded === m.job.id && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <MatchBreakdownView match={m} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && matches.length >= limit && (
        <div className="mt-6 text-center">
          <button className="btn-outline" onClick={() => setLimit((l) => l + 10)}>
            Ver mais
          </button>
        </div>
      )}
    </div>
  )
}
