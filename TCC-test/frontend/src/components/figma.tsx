import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/**
 * Figma page-header pattern used across candidate/company/admin areas:
 *   "← Voltar" link → eyebrow (AREA / SCREEN) → big title → subtitle.
 */
export function AreaHeader({
  eyebrow,
  title,
  subtitle,
  backTo,
  backLabel = 'Voltar',
  actions,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  backTo?: string
  backLabel?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-8">
      {backTo && (
        <Link to={backTo} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-600">
          ← {backLabel}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="area-title mt-1">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}

/** Wizard / flow step indicator — "01 / ACESSO → 02 / PERFIL" style. */
export function StepNav({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={s} className="flex items-center gap-3">
            <span className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                  done
                    ? 'bg-brand-600 text-white'
                    : active
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {done ? '✓' : `0${i + 1}`}
              </span>
              <span className={`text-sm font-medium ${active || done ? 'text-slate-800' : 'text-slate-400'}`}>
                {s}
              </span>
            </span>
            {i < steps.length - 1 && <span className="hidden h-px w-8 bg-slate-200 sm:block" />}
          </li>
        )
      })}
    </ol>
  )
}

/** Key/value row used inside Figma sidebar summary cards. */
export function FactRow({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className={`text-right ${strong ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'}`}>{value}</dd>
    </div>
  )
}

/** Small explanatory side card — "Matching não decide por você" pattern. */
export function NoteCard({ title, children, tone = 'brand' }: { title?: string; children: ReactNode; tone?: 'brand' | 'accent' | 'slate' }) {
  const cls =
    tone === 'accent'
      ? 'border-accent-200 bg-accent-50/60'
      : tone === 'slate'
        ? 'border-slate-200 bg-slate-50'
        : 'border-brand-200 bg-brand-50/50'
  return (
    <div className={`rounded-2xl border p-4 text-sm ${cls}`}>
      {title && <p className="mb-1 font-semibold text-slate-800">{title}</p>}
      <div className="text-slate-600">{children}</div>
    </div>
  )
}
