import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import type { JobMatch } from '../../types'
import { ScoreBadge } from '../../components/ScoreBadge'
import { MatchBreakdownView } from '../../components/MatchBreakdown'
import { EmptyState, Spinner } from '../../components/ui'
import { AreaHeader, FactRow, NoteCard } from '../../components/figma'
import { WORK_MODE_LABELS, label } from '../../lib/labels'

function compatLabel(score: number) {
  if (score >= 70) return { text: 'Alta compatibilidade', cls: 'bg-brand-100 text-brand-700' }
  if (score >= 40) return { text: 'Boa compatibilidade', cls: 'bg-accent-100 text-accent-700' }
  return { text: 'Vale explorar', cls: 'bg-slate-100 text-slate-600' }
}

export function Matching() {
  const { user } = useAuth()
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

  const profile = user?.candidate_profile

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <AreaHeader
        eyebrow="CANDIDATO / VAGAS PARA MEU PERFIL"
        title={`${matches.length} ${matches.length === 1 ? 'vaga para explorar' : 'vagas para explorar'}`}
        subtitle="Vagas ranqueadas por compatibilidade com seu perfil. O score considera competências essenciais (50 pts), desejáveis (10 pts), experiência (25 pts) e preferências (15 pts)."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
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
              {matches.map((m, i) => {
                const compat = compatLabel(m.score)
                const inCommon = m.criteria.essential.matched ?? m.matched_skills
                const toCheck = [...(m.criteria.essential.partial ?? []), ...(m.criteria.essential.missing ?? [])]
                return (
                  <div key={m.job.id} className="card p-5 transition-all hover:shadow-card-hover">
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-sm font-extrabold text-white">
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to={`/jobs/${m.job.id}`} className="font-bold text-slate-900 hover:text-brand-700">
                            {m.job.title}
                          </Link>
                          <span className={`badge px-2.5 py-0.5 text-xs font-semibold ${compat.cls}`}>{compat.text}</span>
                        </div>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {m.job.company_name} · {m.job.location} · {label(WORK_MODE_LABELS, m.job.work_mode)}
                        </p>

                        {inCommon.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Em comum</p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {inCommon.map((s) => (
                                <span key={s} className="badge bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {toCheck.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Para conferir</p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {toCheck.map((s) => (
                                <span key={s} className="badge bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <ScoreBadge score={m.score} />
                        <button
                          className="text-xs font-semibold text-brand-600 hover:underline"
                          onClick={() => setExpanded(expanded === m.job.id ? null : m.job.id)}
                        >
                          {expanded === m.job.id ? 'Ocultar análise' : 'Ver análise'}
                        </button>
                      </div>
                    </div>
                    {expanded === m.job.id && (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <MatchBreakdownView match={m} />
                      </div>
                    )}
                  </div>
                )
              })}
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

        {/* Sidebar — Figma "Sua base profissional" */}
        <aside className="space-y-4">
          <div className="card p-5">
            <p className="eyebrow">Sua base profissional</p>
            <p className="mt-2 font-bold text-slate-900">{user?.first_name} {user?.last_name}</p>
            <p className="text-sm text-slate-500">{profile?.headline || 'Complete seu título profissional'}</p>
            <dl className="mt-3 divide-y divide-slate-100">
              <FactRow label="Habilidades" value={profile?.skills.length ?? 0} />
              <FactRow label="Experiência" value={`${profile?.experience_years ?? 0} ano(s)`} />
              <FactRow label="Localização" value={user?.city || '—'} />
              <FactRow label="Área de interesse" value={profile?.preferred_category || '—'} />
            </dl>
            <Link to="/profile" className="btn-outline mt-4 w-full justify-center text-sm">
              Atualizar perfil
            </Link>
          </div>
          <NoteCard title="Matching não decide por você">
            Os scores são um apoio à decisão. Nenhuma candidatura é enviada
            automaticamente — você escolhe quando se candidatar.
          </NoteCard>
        </aside>
      </div>
    </div>
  )
}
