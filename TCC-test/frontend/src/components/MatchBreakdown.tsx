import type { MatchBreakdown } from '../types'

const CRITERIA: { key: keyof MatchBreakdown['criteria']; label: string; max: number }[] = [
  { key: 'essential', label: 'Competências essenciais', max: 50 },
  { key: 'desired', label: 'Competências desejáveis', max: 10 },
  { key: 'experience', label: 'Experiência', max: 25 },
  { key: 'preferences', label: 'Preferências', max: 15 },
]

function SkillChips({ matched = [], partial = [], missing = [] }: {
  matched?: string[]; partial?: string[]; missing?: string[]
}) {
  if (!matched.length && !partial.length && !missing.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
      {matched.map((s) => (
        <span key={s} className="badge bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200">✓ {s}</span>
      ))}
      {partial.map((s) => (
        <span key={s} className="badge bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">~ {s}</span>
      ))}
      {missing.map((s) => (
        <span key={s} className="badge bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200">○ {s}</span>
      ))}
    </div>
  )
}

/**
 * Explainable compatibility breakdown (Figma matching model):
 * 50 essential / 10 desired / 25 experience / 15 preferences.
 * Missing information is shown as "not informed", never as a negative.
 */
export function MatchBreakdownView({ match }: { match: MatchBreakdown }) {
  return (
    <div className="space-y-3">
      {CRITERIA.map(({ key, label, max }) => {
        const c = match.criteria[key]
        const pct = max ? Math.round((c.score / max) * 100) : 0
        return (
          <div key={key} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{label}</span>
              <span className="font-bold text-slate-900">{c.score}/{max} pts</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${pct >= 70 ? 'bg-brand-500' : pct >= 40 ? 'bg-accent-500' : 'bg-slate-300'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {(key === 'essential' || key === 'desired') && (
              <SkillChips matched={c.matched} partial={c.partial} missing={c.missing} />
            )}
            {key === 'experience' && (
              <p className="mt-1.5 text-xs text-slate-500">
                {c.experience_years ?? 0} ano(s) de experiência · nível {c.seniority ?? '—'} da vaga
                {typeof c.text_similarity === 'number' && ` · similaridade textual ${Math.round(c.text_similarity * 100)}%`}
              </p>
            )}
            {key === 'preferences' && (
              <p className="mt-1.5 text-xs text-slate-500">
                Localização, modelo de trabalho e área de interesse
              </p>
            )}
          </div>
        )
      })}
      <p className="text-xs text-slate-400">
        O score é um apoio à decisão — não aprova nem reprova candidatos automaticamente.
        Informações ausentes aparecem como “não informadas”, não como falta de competência.
      </p>
    </div>
  )
}
