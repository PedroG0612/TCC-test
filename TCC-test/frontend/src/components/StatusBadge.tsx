import { APPLICATION_STATUS_LABELS, JOB_STATUS_LABELS } from '../lib/labels'

const LABELS: Record<string, string> = {
  ...APPLICATION_STATUS_LABELS,
  ...JOB_STATUS_LABELS,
}

const STYLES: Record<string, string> = {
  applied: 'bg-brand-50 text-brand-700 ring-brand-200',
  under_review: 'bg-amber-50 text-amber-700 ring-amber-200',
  interview: 'bg-accent-50 text-accent-700 ring-accent-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
  hired: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  draft: 'bg-slate-100 text-slate-600 ring-slate-200',
  published: 'bg-brand-600 text-white ring-brand-600',
  paused: 'bg-amber-100 text-amber-800 ring-amber-300',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ring-1 ring-inset ${STYLES[status] ?? STYLES.draft}`}>
      {LABELS[status] ?? status}
    </span>
  )
}
